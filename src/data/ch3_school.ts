import { point } from './ch2_maps';
import { DIALOGUES } from './dialogues';
import { stickerPictures, STICKERS, STICKER_PAGES } from './items';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Subject } from './quiz';
import { CH3_SCHOOL_QUIZ } from './quiz_ch3';

interface Lesson {
  no: number; title: string; subject: Subject; teacher: string; after: string;
  map: string; col: number; row: number; summary: string; sticker: string; picture: string;
  invitation: string; task: string; ending: string;
}

const lessons: Lesson[] = [
  {
    no: 11, title: '哪一句是在問', subject: 'chinese', teacher: 'yuanyuan', after: 'c3m4',
    map: 'twobanks', col: 6, row: 16, sticker: '圓圓的問句紙條', picture: 'c3_letter',
    summary: '到兩岸村西岸找圓圓。和她讀問句，寫張紙條約朋友來碼頭。',
    invitation: '我想約朋友明天來碼頭。要怎麼問，她才知道在哪裡等我？',
    task: '一起讀讀這些問句吧。看看每句話想問什麼。',
    ending: '寫好了！「妳明天早上要來東岸碼頭等我嗎？」我把紙條送去給她！',
  },
  {
    no: 12, title: '碼頭的顏色', subject: 'english', teacher: 'juanjuan', after: 'c3m5',
    map: 'twobanks', col: 17, row: 15, sticker: '藍船和黃旗木牌', picture: 'c3_flag',
    summary: '到兩岸村東岸找捲捲。讀木牌上的英文，幫她配上顏色和圖案。',
    invitation: '木牌上寫著船和旗子的顏色。我想配上小圖，讓朋友一眼就找到船！',
    task: '我拿好畫筆了。幫我看看，要畫哪一種顏色？',
    ending: '藍船旁邊配一面黃旗。妳看！船上的朋友也朝木牌揮起黃旗了！',
  },
  {
    no: 13, title: '兩籃分一樣', subject: 'math', teacher: 'juanjuan', after: 'c3m6',
    map: 'knotbridge', col: 4, row: 12, sticker: '橋頭的兩籃點心', picture: 'w_cookie',
    summary: '去雙結橋西橋頭找捲捲。一起算點心的份量，讓兩岸的朋友都吃得到。',
    invitation: '兩邊等船的朋友都餓了。我帶了兩個空籃子，妳能幫我分點心嗎？',
    task: '每個人都要分得到。我先數餅，妳來算算看！',
    ending: '分好了。妳拿西岸這籃，我把另一籃送過橋，一起出發！',
  },
  {
    no: 14, title: '風吹哪一邊', subject: 'science', teacher: 'lulu', after: 'c3m8',
    map: 'twobanks', col: 16, row: 7, sticker: '露露的風向筆記', picture: 'lulu_big',
    summary: '去兩岸村東岸找露露。看布尾和草葉，找出風從哪一邊吹來。',
    invitation: '我把一條布綁在桿子上了。妳看看布尾，再看看草葉，都動起來了！',
    task: '我們一起來看風。它從哪裡來？又吹到哪裡去？',
    ending: '布尾往東飄，風從西邊來！我在本子上畫了一支從西指向東的箭頭。',
  },
];

for (const lesson of lessons) {
  const { no, title, subject, teacher, after, map, col, row, summary } = lesson;
  const id = `c3s${no}`;
  const sticker = `${id}_sticker`;
  const npc = NPCS.find(n => n.id === teacher)!;
  QUESTS[id] = {
    id, no, chapter: 3, kind: 'side', title, giver: teacher, prereq: [after], summary,
    objectives: [{ id: 'quiz', type: 'event', text: `和${npc.name}一起答五題`, marker: [teacher] }],
    rewards: { exp: 100, money: 15, sticker },
  };
  QUEST_ORDER.push(id);
  STICKERS[sticker] = lesson.sticker;
  stickerPictures[sticker] = lesson.picture;
  STICKER_PAGES.find(page => page.id === 'river_friends')!.ids.push(sticker);
  (npc.giverOf ??= []).push(id);
  npc.spots.unshift({ map, ...point(col, row), when: { map, any: [{ questAvailable: id }, { questActive: id }] } });
  npc.talk.unshift(
    { when: { map, questAvailable: id }, d: `${id}_start` },
    { when: { map, objCurrent: [id, 'quiz'] }, d: `${id}_quiz` },
  );
  DIALOGUES[`${id}_start`] = [{ s: teacher, t: lesson.invitation, act: [{ type: 'startQuest', id }] }];
  DIALOGUES[`${id}_quiz`] = [
    { s: teacher, t: lesson.task, act: [{
      type: 'quiz', subject, by: teacher, title, n: 5, ids: CH3_SCHOOL_QUIZ[subject].map(q => q.id),
    }] },
    { s: teacher, t: lesson.ending, act: [{ type: 'obj', quest: id, obj: 'quiz' }, { type: 'save' }] },
  ];
}
