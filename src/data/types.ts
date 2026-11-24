import type { Voice } from '../core/sfx';
import type { ReplyToLetter, WriteLetter } from './letters';
// 資料驅動的型別定義：之後的章節只要新增資料檔即可擴充。
export type Cond = {
  questActive?: string; questDone?: string; questNotDone?: string; questAvailable?: string; questNotStarted?: string;
  objCurrent?: [string, string]; objDone?: [string, string]; objNotDone?: [string, string];
  flag?: string; notFlag?: string; time?: 'day' | 'night'; minObs?: number; minCourage?: number; minKindness?: number; minKindCh2?: number; map?: string;
  inParty?: string; recruited?: string; notRecruited?: string; minActive?: number; maxActive?: number; weather?: 'rain' | 'clear'; minBond?: [string, number]; maxBond?: [string, number]; minCompanions?: number;
  hasItem?: [string, number]; minStickers?: number; allStickers?: boolean; allChapter1Stickers?: boolean; hasSticker?: string;
  all?: Cond[]; any?: Cond[]; not?: Cond;
};

export type Action =
  | WriteLetter
  | ReplyToLetter
  | { type: 'startQuest'; id: string }
  | { type: 'obj'; quest: string; obj: string; n?: number }
  | { type: 'item'; id: string; n?: number }
  | { type: 'money'; n: number }
  | { type: 'buy'; id: string; price: number }
  | { type: 'flag'; id: string; value?: boolean }
  | { type: 'stat'; courage?: number; kindness?: number; observation?: number }
  | { type: 'stat'; key: import('../core/hearts').ChapterStat; n: number; event?: string }
  | { type: 'exp'; n: number }
  | { type: 'sticker'; id: string }
  | { type: 'systemActivate' }
  | { type: 'openPanel'; tab: 'status' | 'quests' | 'items'; thenObj?: [string, string] }
  | { type: 'rest' }
  | { type: 'save' }
  | { type: 'nextMorning' }
  | { type: 'sleep'; to: 'day' | 'night' }
  | { type: 'innTalk' }
  | { type: 'newDay' }
  | { type: 'battle'; encounter: string }
  | { type: 'sfx'; id: string }
  | { type: 'warp'; map: string; x: number; y: number; dir?: number }
  | { type: 'time'; v: 'day' | 'night' }
  | { type: 'recruit'; id: string }
  | { type: 'guest'; id: string | null }
  | { type: 'title'; id: string }
  | { type: 'music'; id: string | null }
  | { type: 'chapterEnd'; chapter?: 2 | 3 }
  | { type: 'c2Breeze' }
  | { type: 'take'; id: string; n?: number }
  | { type: 'shop'; items: { id: string; price: number; when?: Cond }[]; title?: string }
  | { type: 'party' }
  | { type: 'wait'; ms: number }
  | { type: 'fog'; x: number; y: number; n?: number }
  | { type: 'shake'; ms?: number }
  | { type: 'dim' }
  | { type: 'stage'; playerLift?: number; at?: { x: number; y: number; dir?: number } }
  | { type: 'walkOff'; npc: string; x: number; y: number; ms: number; ride?: boolean; passenger?: string }
  | { type: 'quiz'; subject?: 'math' | 'english' | 'science' | 'chinese' | 'mix'; tier?: number; n?: number; by?: string; title?: string; ids?: string[] }
  | { type: 'learn'; id: string; skill: string }
  | { type: 'equip'; id: string }
  | { type: 'travel' }
  | { type: 'bond'; id: string; n?: number; level?: 4 }
  | { type: 'night' }
  | { type: 'stickerBoard' }
  | { type: 'gift'; id: string }
  | { type: 'trade' }
  | { type: 'swapIn'; id: string }
  | { type: 'abort' };

type Choice = { label: string; act?: Action[]; next?: string; when?: Cond } & (
  { brave: true; braveId: string; surprise: string; minCourage?: number; chapter?: 2 | 3 } |
  { brave?: never; minCourage?: never }
);
export interface Line {
  s: string;            // 說話者：npc id、'hero'、'system'、'narr'
  t: string;            // 文字（{name} 會替換成主角名字）
  meow?: string;        // 系統啟動前貓咪說的話（沒寫就自動產生「喵」）
  flashBow?: boolean;
  glitch?: boolean;
  think?: boolean;      // 主角心裡的話
  act?: Action[];       // 這句顯示後執行
  when?: Cond;          // 條件不成立就跳過這句（例如夥伴在隊伍裡才說的話）
  choices?: Choice[];
}
export type Dialogue = Line[];

export type ObjType = 'talk' | 'reach' | 'collect' | 'defeat' | 'inspect' | 'resolve' | 'event' | 'battle';
export interface Objective { id: string; type: ObjType; text: string; targets?: string[]; count?: number; unique?: boolean; marker?: string[]; auto?: Cond; }
export interface Reward { exp?: number; money?: number; items?: { id: string; n: number }[]; courage?: number; observation?: number; flags?: string[]; sticker?: string; }
export interface QuestDef {
  id: string; chapter?: 2 | 3; kind: 'main' | 'side'; no: number; title: string; giver?: string; summary: string;
  prereq: string[]; bond?: [string, number]; autoStart?: boolean; autoStartAfter?: string; ordered?: boolean; objectives: Objective[];
  rewards: Reward; rewardText?: string[]; unlocks?: string[]; onComplete?: string; comingSoon?: boolean;
}

export interface ItemDef { id: string; name: string; kind: 'heal' | 'material' | 'weapon' | 'accessory' | 'key' | 'collect'; desc: string; heal?: number; atk?: number; price?: number; battle?: boolean; food?: boolean; healAll?: boolean; bonus?: { who?: string; atk?: number; def?: number; spd?: number; hp?: number }; }

export interface EnemyDef {
  mood?: import('../core/hearts').Mood; weak?: string;
  id: string; name: string; sprite: string; hp: number; atk: number; def: number; spd: number; exp: number; money: number;
  talkBase: number; talkLines: string[]; talkFail: string[]; gifts: { item: string; chance: number }[]; info?: string[];
  skills?: { id: string; name: string; chance: number; power: number; status?: 'sticky' | 'stun' | 'sleep' | 'bind' | 'cry'; target?: 'all'; roar?: boolean; steal?: boolean; call?: boolean; flee?: boolean; mimic?: boolean; doze?: boolean }[];
  boss?: { lateTurn: number; lateHp: number; lateTalk: number; earlyTalk: number; lateLines: string[]; earlyLines: string[] };
  likesFood?: boolean | string[];
  foodReply?: string; foodRefusal?: string;
  talkBonus?: { when: Cond; add: number };
  sticker?: string; // 貼紙用的魔物種類（同種魔物共用）
}
export interface EncounterGroup { enemies: string[]; weight: number; when?: Cond; }
export interface EncounterTable { id: string; rate: number; minSteps: number; groups: EncounterGroup[]; bg: string; }
export interface FixedEncounter { practice?: boolean; id: string; enemies: string[]; bg: string; hint?: string; forceTalk?: boolean; talkScript?: string; noEscape?: boolean; event?: [string, string]; intro?: string; music?: import('../core/music').TrackId; talkFlag?: string; talkLines?: string[]; talkBonus?: number; startLines?: { who: string; t: string }[]; lateLines?: { who: string; t: string }[] }

export interface NpcDef {
  id: string; name: string; sprite: string; portrait?: string; isCat?: boolean; scale?: number;
  spots: { when?: Cond; map: string; x: number; y: number; hidden?: boolean; flip?: boolean; lift?: number; sprite?: string }[];
  noShadow?: boolean; // 家具之類的（沒有影子）
  bob?: boolean;       // 原地輕輕上下動（例如發抖、跳舞）
  talk: { when?: Cond; d: string }[];
  giverOf?: string[];  // 可接的支線（顯示「！」）
  followScale?: number; followGap?: number;
  follow?: Cond;       // 條件成立時，這個角色會跟在主角後面（跨地圖）
  goblin?: boolean;    // 哥布林（說話聲音不同）
  portraitH?: number;  // 對話時立繪高度
  voice?: Voice;       // 貓咪說話時的叫聲（每隻都不一樣）
}

export interface PropDef { key: string; x: number; y: number; scale?: number; block?: [number, number]; glow?: boolean; flip?: boolean; hidden?: boolean; flipY?: boolean; when?: Cond; depth?: number; }
export interface ExitDef { tx: number; ty: number; to: string; x: number; y: number; when?: Cond; lockedDialogue?: string; push?: [number, number]; up?: boolean; dir?: number; needSize?: 'small' | 'big'; } // up：要往上走（面向門）才會進去
export interface ZoneDef { id: string; x: number; y: number; w: number; h: number; encounter?: string; }
export interface GlintDef { id: string; map: string; x: number; y: number; obs: number; when?: Cond; once?: string; d: string; kind?: 'glint' | 'prints' | 'paw'; sprite?: string; spriteOrigin?: 'base'; needSize?: 'small' | 'big'; sizeHint?: string; }
// 奇妙圈圈：站進去可以變小／變大（只在 area 範圍裡有效，走出去就變回來）
export interface WonderDef { id: string; map: string; x: number; y: number; mode: 'small' | 'big'; area: { x: number; y: number; w: number; h: number }; when?: Cond; }
export interface TriggerDef { id: string; map: string; when?: Cond; once: string; d: string; zone?: { x: number; y: number; w: number; h: number }; }
export interface MapDef {
  id: string; name: string; tiles: string[]; props: PropDef[]; exits: ExitDef[]; zones: ZoneDef[];
  encounter?: string; indoor?: boolean; trees?: boolean; music?: 'village' | 'field' | 'forest' | 'boss' | 'mist' | 'roots' | 'echo' | 'reed' | 'banks'; riverbank?: boolean; mist?: boolean; labels?: { x: number; y: number; text: string; when?: Cond }[]; forest?: boolean; flipTrees?: boolean; nightAlways?: boolean; guidePaw?: { when: Cond; points: [number, number][] };
}
