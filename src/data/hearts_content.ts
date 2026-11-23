import { DIALOGUES } from './dialogues';
import { GLINTS } from './maps';
import { ITEMS, STICKERS, STICKER_PAGES } from './items';
import { HERO_TITLES } from '../core/hearts';
import type { Line } from './types';

ITEMS.shining_cape = { id: 'shining_cape', name: '閃亮勇士披風', kind: 'accessory', desc: '防禦 +2，HP 上限 +10。', bonus: { def: 2, hp: 10 } };
const titles = HERO_TITLES.slice(1).map((title, i) => {
  const id = `title_t${i + 1}`;
  STICKERS[id] = title;
  return id;
});
STICKER_PAGES.push({ id: 'hero_titles', name: '勇士', ids: titles });

function brave(id: string, t: string, label: string, surprise: string, minCourage?: number): Line {
  return { s: 'hero', t, choices: [
    { label: '慢慢來' },
    { label, brave: true, braveId: id, surprise, minCourage },
  ] };
}
DIALOGUES.main3_guard.splice(1, 0, brave('guard', '守衛好高。我要怎麼開口呢？', '先打招呼', '守衛點點頭，也揮了揮手。'));
DIALOGUES.glint_fp3.unshift(brave('prints', '腳印消失在草邊。', '撥開草葉看看', '草葉後面，有一道小小的月光。'));
DIALOGUES.glint_douhua.unshift(brave('douhua', '前面好像有人。', '輕輕喊豆花的名字', '草叢傳來小小的一聲「喵」。'));
DIALOGUES.main11_boss.splice(3, 0, brave('rock', '巨岩緊緊握著樹幹。', '先說出來意', '巨岩的手鬆了一下。'));
DIALOGUES.c2_enter.splice(1, 0, brave('mist', '霧裡傳來哭聲。', '往前叫一聲', '遠遠地，有人輕輕回了一聲。'));
DIALOGUES.c2_find.unshift(brave('sprout', '小豆芽就在前面。', '先報平安', '小豆芽認出了妳的聲音。'));
STICKERS.brave_hollow = '黑黑的樹洞';
STICKER_PAGES.find(p => p.id === 'hero_titles')!.ids.push('brave_hollow');
const hollow = brave('hollow', '黑黑的樹洞裡，有一點亮光。', '伸手摸摸看', '摸到了一顆月光莓，還有一張貼紙！', 8);
hollow.choices![1].act = [{ type: 'item', id: 'moon_berry' }, { type: 'sticker', id: 'brave_hollow' }];
DIALOGUES.brave_hollow = [hollow];
GLINTS.push({ id: 'brave_hollow', map: 'forest', x: 304, y: 250, obs: 0, when: { notFlag: 'brave_hollow' }, d: 'brave_hollow' });

export const THOUGHTS: Record<string, { obs: number; text: string; name: string; chapter?: 2 }> = {
  farmer: { obs: 2, text: '咕咕一定餓壞了。下次多烤一顆番薯吧。', name: '多烤一顆番薯' },
  guard: { obs: 3, text: '妳敢走過來打招呼，真棒。', name: '守衛的小小稱讚' },
  mochimom: { obs: 2, text: '等豆花回家，我要給牠一個抱抱。', name: '媽媽的抱抱' },
  ginkgo: { obs: 4, text: '薄荷喜歡草藥的香味。我留一小束給牠。', name: '一小束草藥' },
  elder: { obs: 5, text: '大家坐在一起吃飯，真好。', name: '一起吃飯' },
  c2_mist_guide: { obs: 3, text: '謝謝妳停下來聽我說。', name: '霧裡的謝謝' },
  chief: { obs: 6, chapter: 2, text: '屋頂修好了。下雨時，大家就能安心睡了。', name: '安心的小屋' },
  pudding: { obs: 5, text: '那隻小松鼠今天有吃飽嗎？', name: '布丁的牽掛' },
};
const thoughts = Object.entries(THOUGHTS).map(([id, thought]) => {
  const key = `thought_${id}`;
  STICKERS[key] = thought.name;
  DIALOGUES[key] = [{ s: id, t: thought.text, think: true, act: [{ type: 'sticker', id: key }] }];
  return key;
});
STICKER_PAGES.push({ id: 'thoughts', name: '心裡的話', ids: thoughts });
