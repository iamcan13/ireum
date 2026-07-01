// 영속성 추상화 — 기본은 localStorage. 동일 인터페이스로 나중에 Supabase 어댑터로 교체 가능.
// (Supabase로 켜려면: @supabase/supabase-js 설치 + NEXT_PUBLIC_SUPABASE_URL/ANON_KEY 설정 후
//  createSupabaseStorage()를 getStorage()에서 반환하도록 바꾸면 됨 — UI 코드는 그대로.)

import type { Suggestion } from "../naming/types";
import type { SajuResult } from "../saju";

export interface SavedName {
  id: string;
  given: string;
  fullName: string;
  hanjaString: string;
  meaning: string;
  savedAt: number;
  suggestion: Suggestion; // 상세보기 복원용
  saju: SajuResult | null; // 저장 시점 사주 스냅샷
}

export interface IeumStorage {
  readonly kind: "local" | "supabase";
  list(): Promise<SavedName[]>;
  add(name: SavedName): Promise<void>;
  remove(id: string): Promise<void>;
}

const KEY = "ieum.favorites.v1";

function createLocalStorage(): IeumStorage {
  const read = (): SavedName[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as SavedName[]) : [];
    } catch {
      return [];
    }
  };
  const write = (list: SavedName[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* quota or private mode — ignore */
    }
  };
  return {
    kind: "local",
    async list() {
      return read().sort((a, b) => b.savedAt - a.savedAt);
    },
    async add(name) {
      const list = read().filter((n) => n.id !== name.id);
      list.push(name);
      write(list);
    },
    async remove(id) {
      write(read().filter((n) => n.id !== id));
    },
  };
}

/**
 * Supabase 어댑터 (스텁). 환경변수가 설정되고 @supabase/supabase-js가 설치되면
 * 이 함수를 구현해 getStorage()에서 반환한다. 인터페이스는 IeumStorage 그대로.
 */
export function isSupabaseConfigured(): boolean {
  return (
    typeof process !== "undefined" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let _storage: IeumStorage | null = null;
export function getStorage(): IeumStorage {
  if (_storage) return _storage;
  // 향후: if (isSupabaseConfigured()) _storage = createSupabaseStorage();
  _storage = createLocalStorage();
  return _storage;
}
