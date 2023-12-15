/* eslint-disable max-len */

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

  // 双指缩放相关

  startPoint1:Point = { x: 0, y: 0 };

  startPoint2:Point = { x: 0, y: 0 };

  lastPoint1:Point = { x: 0, y: 0 };

  lastPoint2:Point = { x: 0, y: 0 };

  diff = { x: 0, y: 0 }; // 相对于上一次pointermove移动差值

  lastPointermove = { x: 0, y: 0 }; // 用于计算diff

  lastCenter:Point = { x: 0, y: 0 };

  initOffset: Point = { x: 0, y: 0 }; // 初始时视频偏移量

  offset: Point = { x: 0, y: 0 }; // 当前相对偏移量

  lastOffset: Point = { x: 0, y: 0 }; // 上一次的偏移量

  originHaveSet = false; // 是否已经重设origin
  // end

  longPressTimer: any = 0;

  curScale = 1;

  lastScale = 1;

  scaleOrigin = { x: 0, y: 0 };

  lastScaleOrigin = { x: 0, y: 0 };

  constructor(dom: HTMLVideoElement) {
    this.dom = dom;
    this.initVideo();
    // PC端监听mouse事件
    // this.dom.addEventListener('mousedown', (e) => this.onPointerDown(e), true);
    // this.dom.addEventListener('mousemove', (e) => this.onPointerMove(e), true);
    // this.dom.addEventListener('mouseup', (e) => this.onPointerUp(e), true);
    // this.dom.addEventListener('mouseleave', (e) => this.onPointerLeave(e), true);
    // 移动端监听touch事件
    this.dom.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.dom.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.dom.addEventListener('touchend', (e) => this.onTouchEnd(e));
    // this.dom.addEventListener('touchcancel', (e) => this.onTouchCancel(e));
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
  onPointerDown(e: MouseEvent) {
    this.longPressTimer = setTimeout(() => {
      if (!this.dom) {
        return;
      }
      this.isMoving = true;
      // PC端
      this.startPoint1 = { x: e.clientX, y: e.clientY };
      this.dom.style.transition = '';
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }, 300);
  }

  onPointerMove(e: MouseEvent) {
    e.preventDefault();
    requestAnimationFrame(() => {
      if (!this.dom || !this.isMoving) {
        return;
      }
      this.lastPoint1 = { x: e.clientX, y: e.clientY };
      const diff = getDiff(this.startPoint1, this.lastPoint1);
      this.offset.x = this.lastOffset.x + diff.x;
      this.offset.y = this.lastOffset.y + diff.y;
      const final = { x: this.offset.x + this.initOffset.x, y: this.offset.y + this.initOffset.y };
      this.dom.style.transform = `translate(${final.x}px, ${final.y}px) scale(${this.curScale})`;
    });
  }

  handleLeaveNew = () => {
    if (!this.dom) {
      return;
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
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

  onPointerLeave(e: MouseEvent) {
    requestAnimationFrame(() => {
      e.preventDefault();
      this.handleLeaveNew();
    });
  }

  onPointerUp(e: MouseEvent) {
    requestAnimationFrame(() => {
      e.preventDefault();
      this.handleLeaveNew();
    });
  }

  // 移动端事件监听
  onTouchStart(e: TouchEvent) {
    requestAnimationFrame(() => {
      const { touches } = e;
      // 移动端 - 单指触碰
      if (touches && touches.length === 1) {
        this.longPressTimer = setTimeout(() => {
          this.isMoving = true;
          this.startPoint1 = { x: touches[0].pageX, y: touches[0].pageY };
          (this.dom as HTMLElement).style.transition = '';
        }, 300);
      } else if (touches && touches.length === 2) {
        // 计算初始双指距离
        this.startPoint1 = { x: touches[0].clientX, y: touches[0].clientY };
        this.startPoint2 = { x: touches[1].clientX, y: touches[1].clientY };
        this.originHaveSet = false;
        this.isMoving = false;
      }
    });
  }

  onTouchMove(e: TouchEvent) {
    e.preventDefault();
    requestAnimationFrame(() => {
      if (!this.dom) {
        return;
      }
      const { touches } = e;
      if (touches && touches.length === 1) {
        // 移动端 - 单指拖拽
        // 满足条件：正在移动中并且timer为null并且初始点长按
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
          return;
        }
        if (!this.isMoving) {
          return;
        }
        this.lastPoint1 = { x: touches[0].pageX, y: touches[0].pageY };
        const diff = getDiff(this.startPoint1, this.lastPoint1);
        this.offset.x = this.lastOffset.x + diff.x;
        this.offset.y = this.lastOffset.y + diff.y;
        const final = { x: this.offset.x + this.initOffset.x, y: this.offset.y + this.initOffset.y };
        this.dom.style.transform = `translate(${final.x}px, ${final.y}px) scale(${this.curScale})`;
      } else if (touches && touches.length === 2) {
        // 移动端 - 双指缩放
        const current1 = { x: touches[0].clientX, y: touches[0].clientY };
        const current2 = { x: touches[1].clientX, y: touches[1].clientY };
        const ratio = getDistance(current1, current2) / getDistance(this.startPoint1, this.startPoint2);
        // 根据缩放比例
        this.curScale = this.lastScale * ratio;
        // 计算当前双指中心点坐标
        if (!this.originHaveSet) {
          this.originHaveSet = true;
          const center = getCenter(current1, current2);
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

  onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    requestAnimationFrame(() => {
      // 双指缩放后重置数据
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      if (e.touches.length !== 1) {
        this.lastScale = this.curScale;
      }
      this.handleLeaveNew();
    });
  }

  onTouchCancel(e: TouchEvent) {
    requestAnimationFrame(() => {
      console.log('cancel');
      if (e.touches.length !== 1) {
        this.lastScale = this.curScale;
      }
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
    this.startPoint1 = { x: 0, y: 0 };
    this.startPoint2 = { x: 0, y: 0 };
    this.lastPoint1 = { x: 0, y: 0 };
    this.lastPoint2 = { x: 0, y: 0 };
    this.scaleOrigin = { x: 0, y: 0 };
    this.isMoving = false;
    this.dom.style.transform = `translate(${this.initOffset.x}px, ${this.initOffset.y}px) scale(${this.curScale})`;
    this.dom.style.transformOrigin = `${-this.initOffset.x}px ${-this.initOffset.y}px`;
  }
}

export default ScaleTranslateDom;
export {
  ScaleTranslateDom,
};
