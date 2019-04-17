import { BUTTONS_SIZE, DEFAULT_HEIGHT, DEFAULT_WIDTH } from './layout/layout-constants'

export class LayoutService {
  constructor(width, height) {
    this.height = height
    this.width = width
    this.widthMul = width / DEFAULT_WIDTH
    this.heightMul = this.heightMinus(BUTTONS_SIZE) / DEFAULT_HEIGHT
  }

  resizeToWidth(width) {
    return width * this.widthMul
  }

  resizeToHeight(height) {
    return height * this.heightMul
  }

  heightMinus(height) {
    return this.height - this.heightToMakeRatio(height)
  }

  heightToMakeRatio(height) {
    const ratio = (DEFAULT_HEIGHT - height) / DEFAULT_WIDTH
    return this.height - ratio * this.width
  }
}