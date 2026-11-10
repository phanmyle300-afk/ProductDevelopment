---
name: react-typescript
description: Phát triển ứng dụng giao diện React 18+ với TypeScript nghiêm ngặt (Strict Type Safety). Thiết kế components tái sử dụng, generic props, discriminated unions cho trạng thái async, tích hợp Next.js App Router boundaries và tối ưu hóa hiệu năng render.
---

# React & TypeScript Development Skill

Kỹ năng này chuyên trách xây dựng giao diện người dùng hiện đại, an toàn kiểu dữ liệu (type-safe) bằng **React 18+** và **TypeScript 5+** trong hệ thống TalentScout ATS Studio và các ứng dụng web frontend.

## Khi nào sử dụng (Triggers)
- Khi phát triển các components React mới (Bảng Kanban, Thẻ ứng viên, Radar Chart, Bộ lọc tìm kiếm).
- Khi định nghĩa types và interfaces cho dữ liệu truyền tải giữa Backend API và Frontend (API Contracts).
- Khi xử lý trạng thái bất đồng bộ (Loading, Error, Success) sử dụng Discriminated Unions để loại trừ bug runtime.
- Khi phân tách ranh giới giữa Server Components và Client Components (`'use client'`) trong Next.js 14.

---

## 1. Nguyên Tắc Cốt Lõi TypeScript Trong React

1. **Strict Type Safety (`noImplicitAny: true`):**
   - Tuyệt đối không sử dụng `any`. Sử dụng `unknown` khi chưa rõ kiểu, kèm type narrowing hoặc type guards.
2. **Discriminated Unions cho Trạng Thái Async:**
   - Thay vì dùng nhiều cờ boolean rời rạc (`isLoading`, `isError`, `data`), sử dụng một union type duy nhất:
   ```typescript
   type AsyncState<T> =
     | { status: 'idle' }
     | { status: 'loading' }
     | { status: 'success'; data: T }
     | { status: 'error'; error: string };
   ```
3. **Explicit Component Props:**
   - Sử dụng `interface` hoặc `type` rõ ràng cho Props. Tránh dùng `React.FC` nếu không cần `children` ngầm định.

---

## 2. Các Mẫu Thiết Kế Component Chuẩn Hóa

### A. Component Thẻ Ứng Viên Kanban (Card Pattern)

```tsx
import React from 'react';

export type ATSStage = 'applied' | 'screened' | 'interview' | 'offer' | 'rejected';

export interface CandidateCardProps {
  id: string;
  name: string;
  isBlindMode: boolean;
  blindCode: string;
  matchScore: number;
  mandatorySkillsMet: boolean;
  stage: ATSStage;
  onSelect: (candidateId: string) => void;
  onStageChange?: (candidateId: string, newStage: ATSStage) => Promise<void>;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  id,
  name,
  isBlindMode,
  blindCode,
  matchScore,
  mandatorySkillsMet,
  stage,
  onSelect
}) => {
  const displayName = isBlindMode ? blindCode : name;
  const scoreColor = matchScore >= 80 ? 'text-emerald-400' : matchScore >= 65 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div 
      onClick={() => onSelect(id)}
      className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/50 transition cursor-pointer backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-100">{displayName}</span>
        <span className={`text-sm font-bold ${scoreColor}`}>{matchScore}%</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="capitalize">{stage}</span>
        {!mandatorySkillsMet && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium">
            Thiếu Mandatory
          </span>
        )}
      </div>
    </div>
  );
};
```

### B. Generic Table Component Với Type Inference

```tsx
import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({ data, columns, keyExtractor, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 font-medium">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.map((item) => (
            <tr 
              key={keyExtractor(item)} 
              onClick={() => onRowClick?.(item)}
              className="hover:bg-slate-800/30 transition cursor-pointer"
            >
              {columns.map((col, idx) => (
                <td key={idx} className="px-4 py-3">
                  {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 3. Quản Lý Sự Kiện & Custom Hooks Type-Safe

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 4. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Không có cảnh báo hoặc lỗi TypeScript (`tsc --noEmit` pass 100%).
- [ ] Không sử dụng `any`, thay vào đó là interfaces hoặc generic type parameters.
- [ ] Xử lý đầy đủ các nhánh trạng thái của Discriminated Union (`idle`, `loading`, `success`, `error`).
- [ ] Đặt `'use client'` chỉ ở các leaf components cần event listeners hoặc React state/hooks.

