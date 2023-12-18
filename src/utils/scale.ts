/* eslint-disable max-len */
const MAX_SCALE = 3;
const MIN_SCALE = 0.5;
type Point = {
  x: number;
  y: number
};
/**
 * 获取两点间距离
 * @param {object} a 第一个点坐标
 * @param {object} b 第二个点坐标
 * @returns
 */
function getDistance(a:Point, b: Point) {
  const x = a.x - b.x;
  const y = a.y - b.y;
  return Math.hypot(x, y); // Math.sqrt(x * x + y * y);
}

/**
 * 获取中点坐标
 * @param {object} a 第一个点坐标
 * @param {object} b 第二个点坐标
 * @returns
 */
function getCenter(a:Point, b: Point) {
  const x = (a.x + b.x) / 2;
  const y = (a.y + b.y) / 2;
  return { x, y };
}

function getDiff(a:Point, b: Point) {
  const x = b.x - a.x;
  const y = b.y - a.y;
  return { x, y };
}

class ScaleTranslateDom {
  dom: HTMLVideoElement | null = null;

  isMoving = false; // 记录移动状态

  pointerArr: any = [];

  startPointArr: any = {};

  endPointArr: any = {};

  initOffset: Point = { x: 0, y: 0 }; // 初始时视频偏移量

  offset: Point = { x: 0, y: 0 }; // 当前相对偏移量

  lastOffset: Point = { x: 0, y: 0 }; // 上一次的偏移量

  originHaveSet = false; // 是否已经重设origin

  firstPointTime: any = 0;

  curScale = 1;

  lastScale = 1;

  scaleOrigin = { x: 0, y: 0 };

  constructor(dom: HTMLVideoElement) {
    this.dom = dom;
    this.initVideo();
    dom.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    dom.addEventListener('pointermove', (e) => this.onPointerMove(e));
    dom.addEventListener('pointerup', (e) => this.onPointerUp(e));
    dom.addEventListener('pointerleave', (e) => this.onPointerLeave(e));

    // this.dom.addEventListener('click', (e) => {
    //   console.log(123123, 'click');
    // });
  }

  initVideo() {
    if (!this.dom) {
      return false;
    }
    // 初始化偏移量，因为video标签的transform是写在外部样式中，所以无法从dom.style中取得
    const curTransformStyle = window.getComputedStyle(this.dom).getPropertyValue('transform');
    const { m41, m42 } = new DOMMatrixReadOnly(curTransformStyle);
    this.initOffset = { x: m41, y: m42 };
    this.dom.style.transform = `translate(${this.initOffset.x}px, ${this.initOffset.y}px) scale(${this.curScale})`;
    return true;
  }

  // 计算相对缩放前的偏移量，rect 为当前变换后元素的四周的位置
  relativeCoordinate(x, y, rect) {
    const cx = (x - rect.left) / this.curScale;
    const cy = (y - rect.top) / this.curScale;
    return {
      x: cx,
      y: cy,
    };
  }

  /**
   * @function 缩放dom
   * @param scaleRatio: 缩放比率
   */
  zoomInOut(scaleRatio: number) {
    if (!this.dom) {
      return;
    }
    this.curScale = scaleRatio;
    const final = { x: this.initOffset.x + this.offset.x, y: this.initOffset.y + this.offset.y };
    this.dom.style.transform = `translate(${final.x}px, ${final.y}px) scale(${this.curScale})`;
  }

  // PC端
  onPointerDown(e: PointerEvent) {
    e.preventDefault();
    requestAnimationFrame(() => {
      this.pointerArr.push(e.pointerId);
      // 移动端 - 单指触碰
      if (this.pointerArr.length === 1) {
        this.isMoving = true;
        this.startPointArr[this.pointerArr[0]] = { x: e.clientX, y: e.clientY };
        this.endPointArr[this.pointerArr[0]] = { x: e.clientX, y: e.clientY };
        (this.dom as HTMLElement).style.transition = '';
        this.firstPointTime = new Date().getTime();
      } else if (this.pointerArr.length === 2) {
        // 计算初始双指距离
        this.isMoving = false;
        this.startPointArr[this.pointerArr[1]] = { x: e.clientX, y: e.clientY };
        this.endPointArr[this.pointerArr[1]] = { x: e.clientX, y: e.clientY };
        this.originHaveSet = false;
      }
    });
  }

  onPointerMove(e: PointerEvent) {
    e.preventDefault();
    requestAnimationFrame(() => {
      if (!this.dom) {
        return;
      }
      if (this.pointerArr.length === 1) {
        this.endPointArr[e.pointerId] = { x: e.clientX, y: e.clientY };
        const dis = getDistance(this.startPointArr[e.pointerId], this.endPointArr[e.pointerId]);
        if (!this.isMoving) {
          return;
        }
        if (new Date().getTime() - this.firstPointTime <= 200 && dis > 1) {
          this.isMoving = false;
          return;
        }
        const diff = getDiff(this.startPointArr[e.pointerId], this.endPointArr[e.pointerId]);
        this.offset.x = this.lastOffset.x + diff.x;
        this.offset.y = this.lastOffset.y + diff.y;
        const final = { x: this.offset.x + this.initOffset.x, y: this.offset.y + this.initOffset.y };
        this.dom.style.transform = `translate(${final.x}px, ${final.y}px) scale(${this.curScale})`;
      } else if (this.pointerArr.length === 2) {
        const [pointId1, pointId2] = this.pointerArr;
        this.endPointArr[e.pointerId] = { x: e.clientX, y: e.clientY };
        const ratio = getDistance(this.endPointArr[pointId1], this.endPointArr[pointId2]) / getDistance(this.startPointArr[pointId1], this.startPointArr[pointId2]);
        // 限制缩放比例范围
        this.curScale = this.lastScale * ratio;
        if (this.lastScale * ratio >= MAX_SCALE) {
          this.curScale = MAX_SCALE;
        } else if (this.lastScale * ratio <= MIN_SCALE) {
          this.curScale = MIN_SCALE;
        }
        // 计算当前双指中心点坐标
        if (!this.originHaveSet) {
          this.originHaveSet = true;
          const center = getCenter(this.endPointArr[pointId1], this.endPointArr[pointId2]);
          const origin = this.relativeCoordinate(center.x, center.y, this.dom.getBoundingClientRect());
          this.offset.x = (this.curScale - 1) * (origin.x - this.scaleOrigin.x) + this.offset.x;
          this.offset.y = (this.curScale - 1) * (origin.y - this.scaleOrigin.y) + this.offset.y;
          this.dom.style.transformOrigin = `${origin.x}px ${origin.y}px`;
          this.scaleOrigin = origin;
        }
        const final = { x: this.offset.x + this.initOffset.x, y: this.offset.y + this.initOffset.y };
        this.dom.style.transform = `translate(${final.x}px, ${final.y}px) scale(${this.curScale})`;
      }
    });
  }

  handleLeaveNew = () => {
    if (!this.dom) {
      return;
    }
    this.isMoving = false;

    // 鼠标抬起时进行边界碰撞检测
    const {
      left: originLeft,
      right: originRight,
      top: originTop,
      bottom: originBottom,
      width: originWidth,
      height: originHeight,
    } = this.dom.getBoundingClientRect();
    // 针对视频的真实宽度和高度做处理，计算出屏幕上的视频宽高
    const { videoWidth, videoHeight } = this.dom;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const windowRatio = window.innerHeight / window.innerWidth;
    const videoRatio = videoHeight / videoWidth;
    let width = 0; // video在屏幕中非黑色区域宽度
    let height = 0; // video在屏幕中非黑色区域高度
    let left = originLeft;
    let right = originRight;
    let top = originTop;
    let bottom = originBottom;

    // 根据宽高比确定缩放基准
    if (videoRatio > windowRatio) {
      // 此时视频高度较大，左右会留黑
      height = originHeight;
      width = height / videoRatio;
      const blankWidth = (originWidth - width) / 2;
      left = originLeft + blankWidth;
      right = originRight - blankWidth;
    } else {
      // 此时视频宽度较大，上下会留黑
      width = originWidth;
      height = width * videoRatio;
      const blankHeight = (originHeight - height) / 2;
      top = originTop + blankHeight;
      bottom = originBottom - blankHeight;
    }

    // 边界碰撞检测
    if (width > windowWidth) {
      if (left > 0) {
        // 左侧超出左边界
        this.offset.x += -left;
      }
      if (right < windowWidth) {
        this.offset.x += (windowWidth - right);
      }
    } else {
      if (left < 0) {
        this.offset.x += -left;
      }
      if (right > windowWidth) {
        this.offset.x += (windowWidth - right);
      }
    }
    // 判断视频高度和视窗高度的关系
    if (height > windowHeight) {
      if (top > 0) {
        // 左侧超出左边界
        this.offset.y += -top;
      }
      if (bottom < windowHeight) {
        this.offset.y += (windowHeight - bottom);
      }
    } else {
      if (top < 0) {
        this.offset.y += -top;
      }
      if (bottom > windowHeight) {
        this.offset.y += (windowHeight - bottom);
      }
    }
    this.lastOffset.x = this.offset.x;
    this.lastOffset.y = this.offset.y; // 重置上一次移动结束的偏移量
    const final = { x: this.initOffset.x + this.offset.x, y: this.initOffset.y + this.offset.y };
    this.dom.style.transform = `translate(${final.x}px, ${final.y}px) scale(${this.curScale})`;
    this.lastScale = this.curScale;
    this.dom.style.transition = 'transform 0.4s';
  };

  onPointerUp(e: PointerEvent) {
    e.preventDefault();
    requestAnimationFrame(() => {
      if (this.isMoving) {
        e.stopPropagation();
      }
      this.lastScale = this.curScale;
      if (this.pointerArr.length) {
        // 双指时只执行一次边界判断
        this.handleLeaveNew();
      }
      this.pointerArr = [];
      this.startPointArr = {};
      this.endPointArr = {};
    });
  }

  onPointerLeave(e: PointerEvent) {
    e.preventDefault();
    if (e.pointerType !== 'mouse') {
      return;
    }
    requestAnimationFrame(() => {
      if (this.isMoving) {
        e.stopPropagation();
      }
      this.lastScale = this.curScale;
      if (this.pointerArr.length) {
        // 双指时只执行一次边界判断
        this.handleLeaveNew();
      }
      this.pointerArr = [];
      this.startPointArr = {};
      this.endPointArr = {};
    });
  }

  /** 重置为初始值 */
  reset() {
    if (!this.dom) {
      return;
    }
    this.curScale = 1;
    this.lastScale = 1;
    this.offset = { x: 0, y: 0 };
    this.lastOffset = { x: 0, y: 0 };
    this.scaleOrigin = { x: 0, y: 0 };
    this.pointerArr = [];
    this.startPointArr = {};
    this.endPointArr = {};
    this.isMoving = false;
    this.dom.style.transform = `translate(${this.initOffset.x}px, ${this.initOffset.y}px) scale(${this.curScale})`;
    this.dom.style.transformOrigin = `${-this.initOffset.x}px ${-this.initOffset.y}px`;
  }
}

export default ScaleTranslateDom;
export {
  ScaleTranslateDom,
};
