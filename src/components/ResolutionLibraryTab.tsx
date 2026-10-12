import React, { useState, useMemo } from 'react';
import { StandardResolution } from '../types';
import { formatMegapixels, formatPixels, getSimplifiedRatio } from '../utils/calculator';
import {
  useCustomResolutions,
  CustomResolutionInput,
} from '../utils/customResolutions';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Search,
  Copy,
  Check,
  Code,
  Plus,
  Edit2,
  Trash2,
  ArrowLeftRight,
  X,
  Sparkles,
  Bookmark,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface ResolutionLibraryTabProps {
  onCopyText: (text: string, label: string) => void;
}

export const ResolutionLibraryTab: React.FC<ResolutionLibraryTabProps> = ({ onCopyText }) => {
  const { t, language } = useLanguage();
  const {
    customResolutions,
    allResolutions,
    addCustomResolution,
    editCustomResolution,
    deleteCustomResolution,
    resetCustomResolutions,
  } = useCustomResolutions();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StandardResolution | null>(null);

  // Modal Form Inputs
  const [formName, setFormName] = useState('');
  const [formWidth, setFormWidth] = useState<number | ''>(1080);
  const [formHeight, setFormHeight] = useState<number | ''>(1920);
  const [formCategory, setFormCategory] = useState<StandardResolution['category']>('custom');
  const [formTag, setFormTag] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string, label: string) => {
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Open modal to add new
  const handleOpenAddModal = (preset?: Partial<CustomResolutionInput>) => {
    setEditingItem(null);
    setFormName(preset?.name || '');
    setFormWidth(preset?.width ?? 1080);
    setFormHeight(preset?.height ?? 1920);
    setFormCategory(preset?.category || 'custom');
    setFormTag(preset?.tag || (language === 'zh' ? '自定义' : 'Custom'));
    setFormDesc(preset?.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing custom item
  const handleOpenEditModal = (item: StandardResolution) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormWidth(item.width);
    setFormHeight(item.height);
    setFormCategory(item.category);
    setFormTag(item.tag || '');
    setFormDesc(item.description);
    setFormError('');
    setIsModalOpen(true);
  };

  // Fork a standard resolution as a custom template
  const handleForkStandard = (std: StandardResolution) => {
    handleOpenAddModal({
      name: `${std.name} ${language === 'zh' ? '(自定义副本)' : '(Custom Copy)'}`,
      width: std.width,
      height: std.height,
      category: std.category,
      tag: language === 'zh' ? `基于${std.tag || '标准'}` : `Based on ${std.tag || 'Standard'}`,
      description: std.description,
    });
  };

  // Handle Form Submission
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const w = typeof formWidth === 'number' ? Math.round(formWidth) : 0;
    const h = typeof formHeight === 'number' ? Math.round(formHeight) : 0;

    if (!formName.trim()) {
      setFormError(language === 'zh' ? '请输入标准分辨率名称' : 'Please enter resolution standard name');
      return;
    }
    if (w <= 0 || h <= 0) {
      setFormError(language === 'zh' ? '宽度与高度必须是大于 0 的有效像素整数' : 'Width and height must be valid positive integers > 0');
      return;
    }

    const defaultTag = language === 'zh' ? '自定义' : 'Custom';
    const defaultDesc = language === 'zh' ? `自定义标准分辨率 (${w} × ${h})` : `Custom standard resolution (${w} × ${h})`;

    const inputData: CustomResolutionInput = {
      name: formName.trim(),
      width: w,
      height: h,
      category: formCategory,
      tag: formTag.trim() || defaultTag,
      description: formDesc.trim() || defaultDesc,
    };

    if (editingItem) {
      editCustomResolution(editingItem.id, inputData);
      onCopyText(`${inputData.name} (${w}×${h})`, language === 'zh' ? '已成功更新自定义分辨率标准' : 'Custom resolution updated');
    } else {
      addCustomResolution(inputData);
      onCopyText(`${inputData.name} (${w}×${h})`, language === 'zh' ? '已成功新增自定义分辨率标准' : 'Custom resolution added');
    }

    setIsModalOpen(false);
  };

  // Handle Deletion
  const handleDeleteConfirm = (id: string, name: string) => {
    deleteCustomResolution(id);
    setDeletingId(null);
    onCopyText(name, language === 'zh' ? '已删除该自定义分辨率标准' : 'Deleted custom resolution');
  };

  // Quick swap width & height in form
  const handleSwapDimensions = () => {
    const tempW = formWidth;
    setFormWidth(formHeight);
    setFormHeight(tempW);
  };

  // Live calculations in form
  const previewWidth = typeof formWidth === 'number' && formWidth > 0 ? formWidth : 0;
  const previewHeight = typeof formHeight === 'number' && formHeight > 0 ? formHeight : 0;
  const previewPixels = previewWidth * previewHeight;
  const previewMegapixels = previewPixels > 0 ? +(previewPixels / 1000000).toFixed(2) : 0;
  const previewRatio = previewWidth > 0 && previewHeight > 0 ? getSimplifiedRatio(previewWidth, previewHeight) : '0:0';
  const previewDivisible8 = previewWidth > 0 && previewHeight > 0 && previewWidth % 8 === 0 && previewHeight % 8 === 0;
  const previewDivisible16 = previewWidth > 0 && previewHeight > 0 && previewWidth % 16 === 0 && previewHeight % 16 === 0;

  // Filtered Resolutions List
  const filteredResolutions = useMemo(() => {
    return allResolutions.filter((res) => {
      const matchSearch =
        res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.aspectRatio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${res.width}x${res.height}`.includes(searchTerm.toLowerCase()) ||
        (res.tag && res.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        res.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'custom') return !!res.isCustom;
      return res.category === categoryFilter;
    });
  }, [allResolutions, searchTerm, categoryFilter]);

  const customCount = customResolutions.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'zh' ? "搜索标准或自定义分辨率 (如 1080p, 4K, 16:9, 小红书)..." : "Search resolutions (e.g. 1080p, 4K, 16:9, Cinema)..."}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg pl-9 pr-3.5 py-2.5 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'zh' ? '新建自定义分辨率' : 'New Custom Resolution'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const confirmMsg = language === 'zh' ? '是否重置为默认自定义示例库？' : 'Reset custom resolutions to default templates?';
              if (window.confirm(confirmMsg)) {
                resetCustomResolutions();
                onCopyText(
                  language === 'zh' ? '已恢复默认自定义示例' : 'Reset to default presets',
                  language === 'zh' ? '自定义标准库已重置' : 'Custom resolutions reset'
                );
              }
            }}
            title={language === 'zh' ? "恢复默认自定义配置" : "Reset custom presets"}
            className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'zh' ? '重置示例' : 'Reset Presets'}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { key: 'all', label: language === 'zh' ? `全部标准 (${allResolutions.length})` : `All (${allResolutions.length})` },
          { key: 'custom', label: language === 'zh' ? `我的自定义 (${customCount})` : `Custom (${customCount})`, badge: true },
          { key: 'video', label: language === 'zh' ? '主流视频' : 'Video' },
          { key: 'social', label: language === 'zh' ? '短视频/社媒' : 'Social' },
          { key: 'display', label: language === 'zh' ? '显示设备' : 'Displays' },
          { key: 'photo', label: language === 'zh' ? '商业摄影' : 'Photography' },
          { key: 'ai', label: language === 'zh' ? 'AI 生图' : 'AI Gen' },
          { key: 'cinema', label: language === 'zh' ? '院线电影' : 'Cinema' },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              categoryFilter === cat.key
                ? cat.key === 'custom'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                  : 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : cat.key === 'custom'
                ? 'bg-slate-800 text-violet-300 hover:bg-slate-750 hover:text-violet-200 border border-violet-800/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
            }`}
          >
            {cat.key === 'custom' && <Sparkles className="w-3 h-3 text-violet-300" />}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Custom Resolutions Highlight Card (when on 'all' or 'custom' filter with items) */}
      {categoryFilter === 'custom' && customCount === 0 && (
        <div className="p-8 border border-dashed border-slate-800 bg-slate-900/60 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-400 flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-slate-200">
            {language === 'zh' ? '暂无自定义分辨率标准' : 'No Custom Resolutions Found'}
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {language === 'zh'
              ? '您可以随时添加业务中高频使用的专属画幅（如电商头图、小红书竖图、特型屏UI等），数据将自动保存在本地浏览器中并在全站计算中生效。'
              : 'Add custom resolutions tailored to your workflow (e-commerce banners, social formats, custom LED displays). Saved locally in browser and available across all tools.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'zh' ? '立即添加第一个自定义标准' : 'Create First Custom Resolution'}</span>
          </button>
        </div>
      )}

      {/* Resolutions Data Table */}
      {filteredResolutions.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                <th className="py-3 px-4 font-semibold">{language === 'zh' ? '名称与分类' : 'Name & Category'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'zh' ? '分辨率 (W × H)' : 'Resolution (W × H)'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'zh' ? '比例 (A:B)' : 'Aspect Ratio'}</th>
                <th className="py-3 px-4 font-semibold text-right">{language === 'zh' ? '总像素量 (px)' : 'Total Pixels (px)'}</th>
                <th className="py-3 px-4 font-semibold text-right">{language === 'zh' ? '百万像素' : 'Megapixels'}</th>
                <th className="py-3 px-4 font-semibold text-center">{language === 'zh' ? '操作与快捷导出' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredResolutions.map((res) => {
                const resText = `${res.width}x${res.height}`;
                const isCustom = !!res.isCustom;

                return (
                  <tr
                    key={res.id}
                    className={`transition-colors ${
                      isCustom
                        ? 'bg-violet-950/20 hover:bg-violet-950/30'
                        : 'hover:bg-slate-850'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{res.name}</span>
                        {isCustom && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-950 text-violet-300 border border-violet-700/60 inline-flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            {language === 'zh' ? '自定义' : 'Custom'}
                          </span>
                        )}
                        {res.tag && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {res.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {res.description}
                      </div>
                    </td>

                    <td className="py-3 px-4 tabular-nums font-bold text-white text-sm">
                      {res.width} × {res.height}
                    </td>

                    <td className="py-3 px-4 text-indigo-400 font-semibold">
                      {res.aspectRatio}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      {formatPixels(res.totalPixels)}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                      {formatMegapixels(res.totalPixels)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Copy Dimension Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(res.id, resText, `${res.name} (${resText})`)}
                          className="py-1 px-2 text-xs font-sans font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors inline-flex items-center gap-1"
                          title={language === 'zh' ? "复制分辨率文本" : "Copy resolution string"}
                        >
                          {copiedId === res.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">{language === 'zh' ? '已复制' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>{resText}</span>
                            </>
                          )}
                        </button>

                        {/* Copy FFmpeg scale Button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `${res.id}-ffmpeg`,
                              `-vf scale=${res.width}:${res.height}`,
                              language === 'zh' ? `FFmpeg scale 滤镜参数` : `FFmpeg scale filter parameter`
                            )
                          }
                          className="p-1 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
                          title={language === 'zh' ? "复制 FFmpeg scale 命令" : "Copy FFmpeg scale filter"}
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>

                        {/* Custom Item Edit & Delete */}
                        {isCustom ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(res)}
                              className="p-1 text-violet-400 hover:text-violet-200 bg-violet-950/60 hover:bg-violet-900/60 border border-violet-800/60 rounded transition-colors"
                              title={language === 'zh' ? "编辑此自定义标准" : "Edit custom resolution"}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {deletingId === res.id ? (
                              <div className="inline-flex items-center gap-1 bg-red-950/80 p-0.5 rounded border border-red-800">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteConfirm(res.id, res.name)}
                                  className="px-1.5 py-0.5 text-[10px] text-white bg-red-600 rounded hover:bg-red-500 font-sans"
                                >
                                  {language === 'zh' ? '确认删' : 'Delete'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  className="px-1 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 font-sans"
                                >
                                  {language === 'zh' ? '取消' : 'Cancel'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingId(res.id)}
                                className="p-1 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
                                title={language === 'zh' ? "删除此自定义标准" : "Delete custom resolution"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          /* Standard Item Fork as Custom */
                          <button
                            type="button"
                            onClick={() => handleForkStandard(res)}
                            className="p-1 text-slate-400 hover:text-violet-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition-colors"
                            title={language === 'zh' ? "以此标准为模板，新建自定义分辨率" : "Fork standard as custom template"}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingItem
                      ? (language === 'zh' ? '编辑自定义分辨率标准' : 'Edit Custom Resolution Standard')
                      : (language === 'zh' ? '新建自定义分辨率标准' : 'New Custom Resolution Standard')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'zh'
                      ? '保存后将存入浏览器并在全站分辨率匹配与裁剪中同步可用'
                      : 'Saved in browser storage and available across all cropping & scaling tools'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              {/* Standard Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {language === 'zh' ? '标准名称' : 'Standard Name'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={language === 'zh' ? "例如：小红书竖版大图、游戏主屏UI、特型广告位..." : "e.g. Social Vertical Banner, Game Main UI, Custom Billboard..."}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Width & Height Inputs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {language === 'zh' ? '分辨率尺寸 (px)' : 'Resolution Dimensions (px)'} <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSwapDimensions}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>{language === 'zh' ? '交换宽高' : 'Swap W/H'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">{language === 'zh' ? '宽度 (Width)' : 'Width'}</div>
                    <input
                      type="number"
                      min="1"
                      max="32768"
                      value={formWidth}
                      onChange={(e) => setFormWidth(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">{language === 'zh' ? '高度 (Height)' : 'Height'}</div>
                    <input
                      type="number"
                      min="1"
                      max="32768"
                      value={formHeight}
                      onChange={(e) => setFormHeight(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Presets for common aspect ratios */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500">{language === 'zh' ? '快速填入画幅：' : 'Quick Presets:'}</span>
                  {[
                    { label: '9:16 (1080×1920)', w: 1080, h: 1920 },
                    { label: '16:9 (1920×1080)', w: 1920, h: 1080 },
                    { label: '3:4 (1200×1600)', w: 1200, h: 1600 },
                    { label: '4:3 (1600×1200)', w: 1600, h: 1200 },
                    { label: '1:1 (1080×1080)', w: 1080, h: 1080 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setFormWidth(preset.w);
                        setFormHeight(preset.h);
                      }}
                      className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time calculated attributes preview card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>{language === 'zh' ? '实时自动解析属性' : 'Live Computed Attributes'}</span>
                  <span className="text-indigo-400 font-mono font-bold text-xs">{previewRatio}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">{language === 'zh' ? '总像素量' : 'Total Pixels'}</span>
                    <span className="font-mono text-slate-200 font-semibold">{formatPixels(previewPixels)}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">{language === 'zh' ? '百万像素' : 'Megapixels'}</span>
                    <span className="font-mono text-slate-200 font-semibold">{previewMegapixels} MP</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800/80 col-span-2 sm:col-span-1">
                    <span className="text-slate-500 block text-[10px]">{language === 'zh' ? '整除性检测' : 'Divisibility Check'}</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono">
                      <span className={previewDivisible8 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {previewDivisible8 ? '✓' : '✗'} {language === 'zh' ? '8倍' : 'mod 8'}
                      </span>
                      <span className={previewDivisible16 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {previewDivisible16 ? '✓' : '✗'} {language === 'zh' ? '16倍' : 'mod 16'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category & Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">{language === 'zh' ? '所属分类' : 'Category'}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as StandardResolution['category'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="custom">{language === 'zh' ? '自定义专属' : 'Custom Exclusive'}</option>
                    <option value="social">{language === 'zh' ? '短视频 / 社交媒体' : 'Short Video / Social'}</option>
                    <option value="video">{language === 'zh' ? '主流视频制作' : 'Mainstream Video'}</option>
                    <option value="display">{language === 'zh' ? '显示设备 / 屏幕' : 'Display / Screens'}</option>
                    <option value="photo">{language === 'zh' ? '商业摄影 / 平面' : 'Commercial Photography'}</option>
                    <option value="ai">{language === 'zh' ? 'AI 生图 / 扩散模型' : 'AI Gen / Diffusion'}</option>
                    <option value="cinema">{language === 'zh' ? '院线电影 / 宽银幕' : 'Cinema / Widescreen'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">{language === 'zh' ? '自定义标签 (可选)' : 'Tag (Optional)'}</label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder={language === 'zh' ? "如：客户A定制、首屏封面、高频规范" : "e.g. Client A, Hero Cover, Frequent"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{language === 'zh' ? '用途与说明 (可选)' : 'Description (Optional)'}</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder={language === 'zh' ? "详细描述该分辨率标准的用途、业务要求或平台规范..." : "Describe the standard usage, project specifications..."}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-lg transition-colors"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {editingItem
                    ? (language === 'zh' ? '保存修改' : 'Save Changes')
                    : (language === 'zh' ? '确认新增标准' : 'Add Standard')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

