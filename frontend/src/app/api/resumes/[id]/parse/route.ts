import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, canAccessResume, sanitizeRawTextPII } from "@/lib/auth-guard";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Helper to extract JSON from raw_text fallback marker
function extractParsedDataFromRawText(rawText: string | null): { cleanText: string; parsedData: any | null } {
  if (!rawText) return { cleanText: "", parsedData: null };

  const startMarker = "<!-- TS_PARSED_DATA_START -->";
  const endMarker = "<!-- TS_PARSED_DATA_END -->";

  const startIndex = rawText.indexOf(startMarker);
  const endIndex = rawText.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const jsonStr = rawText.substring(startIndex + startMarker.length, endIndex).trim();
    const cleanText = (rawText.substring(0, startIndex) + rawText.substring(endIndex + endMarker.length)).trim();
    try {
      const parsedData = JSON.parse(jsonStr);
      return { cleanText, parsedData };
    } catch {
      return { cleanText: rawText, parsedData: null };
    }
  }

  return { cleanText: rawText, parsedData: null };
}

// GET: Check parsing status and retrieve parsed data with security checks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params?.id;
    if (!resumeId) {
      return NextResponse.json({ error: "Thiếu mã định danh resume_id" }, { status: 400 });
    }

    // 1. Verify server session and IDOR permissions
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: "Yêu cầu đăng nhập để truy cập thông tin bóc tách CV." },
        { status: 401 }
      );
    }

    const accessCheck = await canAccessResume(supabase, auth, resumeId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || "Bạn không có quyền truy cập dữ liệu CV này." },
        { status: 403 }
      );
    }

    const resume = accessCheck.resume;
    let parsedData = (resume as any).parsed_data || null;
    let rawText = resume.raw_text || "";

    if (!parsedData && rawText) {
      const extracted = extractParsedDataFromRawText(rawText);
      parsedData = extracted.parsedData;
      rawText = extracted.cleanText;
    }

    // Check if blind screening is requested
    const isBlindParam = request.nextUrl.searchParams.get("blind") === "true";
    if (isBlindParam && rawText) {
      rawText = sanitizeRawTextPII(rawText, true);
    }

    return NextResponse.json({
      resume_id: resume.id,
      candidate_id: resume.candidate_id,
      file_name: resume.file_name,
      parse_status: resume.parse_status || "uploaded",
      raw_text: rawText,
      parsed_data: parsedData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lỗi nạp trạng thái CV" }, { status: 500 });
  }
}

// POST: Trigger real resume parsing with access control
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let tempFilePath: string | null = null;

  try {
    const resumeId = params?.id;
    if (!resumeId) {
      return NextResponse.json({ error: "Thiếu mã định danh resume_id" }, { status: 400 });
    }

    // 1. Verify session and permissions
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: "Yêu cầu đăng nhập để thực hiện bóc tách CV." },
        { status: 401 }
      );
    }

    const accessCheck = await canAccessResume(supabase, auth, resumeId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || "Bạn không có quyền kích hoạt bóc tách CV này." },
        { status: 403 }
      );
    }

    const resume = accessCheck.resume;
    const objectKey = resume?.file_url;
    if (!objectKey) {
      return NextResponse.json(
        { error: "Đường dẫn lưu trữ tệp CV không hợp lệ." },
        { status: 400 }
      );
    }

    // 2. Update status to 'parsing' in database
    await supabase
      .from("resumes")
      .update({ parse_status: "parsing" })
      .eq("id", resumeId);

    // 3. Download file bytes securely from private Supabase Storage bucket 'resumes'
    const { data: fileBlob, error: downloadErr } = await supabase.storage
      .from("resumes")
      .download(objectKey);

    if (downloadErr || !fileBlob) {
      await supabase
        .from("resumes")
        .update({ parse_status: "failed" })
        .eq("id", resumeId);

      return NextResponse.json(
        {
          error: `Không thể tải tệp từ kho lưu trữ bảo mật: ${downloadErr?.message || "File rỗng"}`,
          parse_status: "failed",
        },
        { status: 500 }
      );
    }

    // 4. Write buffer to temporary file for python parser
    const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
    const fileExt = path.extname(resume.file_name || "resume.pdf") || `.${resume.file_type || "pdf"}`;
    tempFilePath = path.join(os.tmpdir(), `ts_cv_${resumeId}_${Date.now()}${fileExt}`);
    fs.writeFileSync(tempFilePath, fileBuffer);

    // 5. Execute python CLI parser
    const cliScriptPath = path.resolve(process.cwd(), "..", "backend", "app", "services", "parse_cli.py");
    const resolvedCli = fs.existsSync(cliScriptPath)
      ? cliScriptPath
      : path.resolve(process.cwd(), "backend", "app", "services", "parse_cli.py");

    const pythonOutput = await new Promise<string>((resolve, reject) => {
      execFile(
        "python",
        [resolvedCli, tempFilePath!, resume.file_name || "resume.pdf"],
        { maxBuffer: 10 * 1024 * 1024, timeout: 45000 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    // 6. Parse JSON output from python CLI
    let parseResult: any;
    try {
      parseResult = JSON.parse(pythonOutput.trim());
    } catch (e: any) {
      throw new Error(`Phản hồi bộ bóc tách không hợp lệ: ${e.message}`);
    }

    // 7. Handle Parsing Failure
    if (!parseResult.success) {
      const errorMsg = parseResult.error || "Bóc tách CV thất bại";
      const failureRawText = `[PARSING_FAILED]: ${errorMsg}`;

      await supabase
        .from("resumes")
        .update({
          parse_status: "failed",
          raw_text: failureRawText,
        })
        .eq("id", resumeId);

      return NextResponse.json({
        success: false,
        parse_status: "failed",
        error: errorMsg,
        error_code: parseResult.error_code || "PARSE_FAILED",
      });
    }

    // 8. Handle Parsing Success
    const rawText = parseResult.raw_text || "";
    const parsedData = parseResult.parsed_data;

    const rawTextWithMarker = `<!-- TS_PARSED_DATA_START -->\n${JSON.stringify(parsedData)}\n<!-- TS_PARSED_DATA_END -->\n${rawText}`;

    // Try updating resumes with parsed_data column first
    const primaryUpdate = await supabase
      .from("resumes")
      .update({
        parse_status: "parsed",
        raw_text: rawTextWithMarker,
        parsed_data: parsedData,
      })
      .eq("id", resumeId);

    if (primaryUpdate.error && primaryUpdate.error.message.includes("parsed_data")) {
      await supabase
        .from("resumes")
        .update({
          parse_status: "parsed",
          raw_text: rawTextWithMarker,
        })
        .eq("id", resumeId);
    }

    return NextResponse.json({
      success: true,
      parse_status: "parsed",
      resume_id: resumeId,
      raw_text: rawText,
      parsed_data: parsedData,
    });
  } catch (err: any) {
    const cleanError = err?.message?.replace(/[\w.-]+@[\w.-]+/g, "[REDACTED_EMAIL]") || "Lỗi xử lý bóc tách hồ sơ";

    try {
      if (params?.id) {
        const { supabase } = await verifyServerSession(request);
        await supabase
          .from("resumes")
          .update({
            parse_status: "failed",
            raw_text: `[ERROR]: ${cleanError}`,
          })
          .eq("id", params.id);
      }
    } catch {}

    return NextResponse.json(
      {
        success: false,
        parse_status: "failed",
        error: cleanError,
      },
      { status: 500 }
    );
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }
  }
}
