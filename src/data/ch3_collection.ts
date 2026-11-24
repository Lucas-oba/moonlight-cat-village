import { STICKERS, STICKER_PAGES, stickerPictures } from './items';
import { QUESTS } from './quests';

// 貼紙跟著已經走過的故事發放。米舟的圖畫好就能收下，改天再邀牠也可以。
const memories = [
  { quest: 'c3m2', id: 'c3_reed_steps', name: '蘆管灘的石階', picture: 'c3_reeds' },
  { quest: 'c3m3', id: 'c3_village_ferry', name: '兩岸村的渡船', picture: 'c3_ferry' },
  { quest: 'c3m5', id: 'c3_bridge_flag', name: '雙結橋的黃布', picture: 'c3_flag' },
  { quest: 'c3s5', id: 'c3_mizhou_map', name: '米舟的河道圖', picture: 'mizhou_big' },
  { quest: 'c3m10', id: 'c3_faner_friend', name: '帆耳站起來了', picture: 'faner_calm' },
];

STICKER_PAGES.push({ id: 'river_friends', name: '河畔的朋友', ids: memories.map(m => m.id) });
for (const memory of memories) {
  STICKERS[memory.id] = memory.name;
  stickerPictures[memory.id] = memory.picture;
  QUESTS[memory.quest].rewards.sticker = memory.id;
}
