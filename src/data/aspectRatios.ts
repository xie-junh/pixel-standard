import { AspectRatioDef } from '../types';

export const COMMON_ASPECT_RATIOS: AspectRatioDef[] = [
  {
    key: '16:9',
    name: '16:9 宽屏',
    w: 16,
    h: 9,
    ratio: 16 / 9,
    category: 'landscape',
    commonUsage: 'YouTube、高清电视、主流网络视频、PC 显示器'
  },
  {
    key: '9:16',
    name: '9:16 竖屏',
    w: 9,
    h: 16,
    ratio: 9 / 16,
    category: 'portrait',
    commonUsage: '抖音、TikTok、快手、Reels、手机全屏短视频'
  },
  {
    key: '4:3',
    name: '4:3 传统标清 / 平板',
    w: 4,
    h: 3,
    ratio: 4 / 3,
    category: 'landscape',
    commonUsage: 'iPad 平板、中画幅摄影、经典电影、复古显示器'
  },
  {
    key: '3:4',
    name: '3:4 竖屏照片',
    w: 3,
    h: 4,
    ratio: 3 / 4,
    category: 'portrait',
    commonUsage: '小红书封面、电商主图竖构图、人像摄影'
  },
  {
    key: '1:1',
    name: '1:1 正方形',
    w: 1,
    h: 1,
    ratio: 1,
    category: 'square',
    commonUsage: '头像、微信朋友圈相册、Instagram 方图、图标'
  },
  {
    key: '3:2',
    name: '3:2 单反全画幅',
    w: 3,
    h: 2,
    ratio: 3 / 2,
    category: 'landscape',
    commonUsage: '35mm 单反相机、无反相机感光元件原生画幅'
  },
  {
    key: '2:3',
    name: '2:3 单反竖向摄影',
    w: 2,
    h: 3,
    ratio: 2 / 3,
    category: 'portrait',
    commonUsage: '全画幅单反竖构图、商业海报、杂志封面'
  },
  {
    key: '4:5',
    name: '4:5 社媒肖像',
    w: 4,
    h: 5,
    ratio: 4 / 5,
    category: 'portrait',
    commonUsage: 'Instagram 动态贴文最大竖直展示比例'
  },
  {
    key: '21:9',
    name: '21:9 超宽荧幕 (64:27)',
    w: 21,
    h: 9,
    ratio: 64 / 27, // 2.37037...
    category: 'landscape',
    commonUsage: '带鱼屏显示器、电影画幅、游戏宽景'
  },
  {
    key: '18:9',
    name: '18:9 (2:1 Univisium)',
    w: 2,
    h: 1,
    ratio: 2,
    category: 'landscape',
    commonUsage: '现代智能手机全面屏、Netflix 剧集推荐格式'
  },
  {
    key: '2.39:1',
    name: '2.39:1 变形宽银幕 (DCI Scope)',
    w: 239,
    h: 100,
    ratio: 2.39,
    category: 'landscape',
    commonUsage: '好莱坞大片、影院宽银幕长片放映'
  },
  {
    key: '5:4',
    name: '5:4 传统画幅',
    w: 5,
    h: 4,
    ratio: 5 / 4,
    category: 'landscape',
    commonUsage: '大画幅摄影 (8x10)、早期工业显示器 (1280x1024)'
  }
];
