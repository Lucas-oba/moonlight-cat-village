export type LetterPicture = { image: string; label: string };
export type LetterMessage = string | LetterPicture;
type Three<T> = [T, T, T];

export type WriteLetter = { type: 'letter'; id: string; from: string; to: string } & (
  | { words: Three<string>; pictures?: Three<LetterPicture> }
  | { words?: Three<string>; pictures: Three<LetterPicture> }
);
export type ReplyToLetter = { type: 'letterReply'; id: string; message: LetterMessage };
export interface SavedLetter {
  id: string;
  from: string;
  to: string;
  mode: 'paper' | 'oral';
  message: LetterMessage;
  reply?: LetterMessage;
}

export const letterExample: WriteLetter = {
  type: 'letter', id: 'debug_river_letter', from: '小穗', to: '點點',
  words: ['妳今天也有來嗎？', '我在河邊等妳。', '妳有看到我嗎？'],
  pictures: [
    { image: 'c3_flag', label: '河邊的黃布' },
    { image: 'c3_ferry', label: '河上的小船' },
    { image: 'c3_clappers', label: '我手上的木片' },
  ],
};
export const letterReplyExample: ReplyToLetter = {
  type: 'letterReply', id: letterExample.id, message: '我也有來。我一直在揮手！',
};
