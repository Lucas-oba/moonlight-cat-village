// 模擬器用的假 Phaser：所有畫面物件都是「什麼都不做」的代理
const any: any = new Proxy(function () {}, { get: (_t, k) => (k === 'x' || k === 'y' || k === 'scaleX' || k === 'scaleY' || k === 'displayHeight' || k === 'width' || k === 'height' ? 100 : any), apply: () => any });
export class Scene {
  add: any = any; tweens: any = { add: () => any }; cameras: any = { main: { shake() {}, fadeIn() {}, fadeOut() {}, flash() {} } };
  scale: any = { width: 390, height: 844, on() {}, off() {} }; events: any = { once() {}, on() {} };
  constructor(_k?: any) {}
}
const Phaser: any = { Scene, Math: { Distance: { Between: () => 0 } }, BlendModes: {} };
export default Phaser;
