const CATEGORY_BACKGROUNDS = {
  '文件处理': 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
  '系统优化': 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
  '效率工具': 'linear-gradient(135deg,#FFFBEB,#FDE68A)',
  '网络工具': 'linear-gradient(135deg,#FDF4FF,#E9D5FF)',
  '其他': 'linear-gradient(135deg,#F8FAFC,#E2E8F0)',
};

export function getCoverPresentation({ cover = '', category = '其他', coverEmoji = '🛠' }) {
  const image = typeof cover === 'string' ? cover.trim() : '';

  return {
    image,
    background: CATEGORY_BACKGROUNDS[category] ?? CATEGORY_BACKGROUNDS['其他'],
    emoji: coverEmoji || '🛠',
  };
}

export { CATEGORY_BACKGROUNDS };
