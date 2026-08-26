'use client';

import { useEffect, useState } from 'react';
import { supabase, dbService, NewsAnnouncement } from '@/lib/supabase';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'iddaa' | 'spor-toto'>('all');
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBadge, setNewBadge] = useState('DUYURU');
  const [newButtonText, setNewButtonText] = useState('İncele');
  const [newButtonAction, setNewButtonAction] = useState('modal:video');
  const [newImage, setNewImage] = useState('');
  const [newTargetPage, setNewTargetPage] = useState('all');

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    setLoading(true);
    const res = await dbService.getAllNews();
    if (res.data) setNews(res.data);
    setLoading(false);
  }

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      if (editingId) {
        const { error } = await supabase.from('news_announcements').update({
          title: newTitle,
          description: newDesc,
          badge_text: newBadge,
          button_text: newButtonText,
          button_action: newButtonAction,
          bg_image_url: newImage || null,
          target_page: newTargetPage

        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('news_announcements').insert({
          title: newTitle,
          description: newDesc,
          badge_text: newBadge,
          button_text: newButtonText,
          button_action: newButtonAction,
          bg_image_url: newImage || null,
          target_page: newTargetPage,
          is_active: true,
          sort_order: news.length + 1
        });
        if (error) throw error;
      }
      
      resetForm();
      fetchNews();
    } catch (err: any) {
      alert('Hata: ' + err.message);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewTitle('');
    setNewDesc('');
    setNewBadge('DUYURU');
    setNewButtonText('İncele');
    setNewButtonAction('modal:video');
    setNewImage('');
    setNewTargetPage(activeTab);
  };

  const startEdit = (item: NewsAnnouncement) => {
    setEditingId(item.id);
    setNewTitle(item.title);
    setNewDesc(item.description);
    setNewBadge(item.badge_text);
    setNewButtonText(item.button_text);
    setNewButtonAction(item.button_action || 'modal:video');
    setNewImage(item.bg_image_url || '');
    setNewTargetPage(item.target_page || 'all');
    setIsAdding(true);
    // Sayfanın en üstüne kaydır (formu görmesi için)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('news_announcements').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      fetchNews();
    } catch (err: any) {
      alert('Hata: ' + err.message);
    }
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) return;
    if (!supabase) return;
    
    try {
      const { error } = await supabase.from('news_announcements').delete().eq('id', id);
      if (error) throw error;
      fetchNews();
    } catch (err: any) {
      alert('Hata: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Haberler ve Duyurular</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Anasayfadaki kayan haber panosunu buradan yönetebilirsiniz.
          </p>
        </div>
        
        <button
          onClick={() => {
            if (isAdding) resetForm();
            else { resetForm(); setIsAdding(true); }
          }}
          className={`flex items-center space-x-2 px-4 py-2 font-semibold rounded-lg transition ${isAdding ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-sky-500 hover:bg-sky-400 text-black'}`}
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{isAdding ? 'İptal' : 'Yeni Haber Ekle'}</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-neutral-900 border border-sky-500/50 rounded-xl p-6 shadow-xl animate-fadeIn">
          <h3 className="text-lg font-semibold text-white mb-4">{editingId ? 'Haberi Düzenle' : 'Yeni Haber Ekle'}</h3>
          <form onSubmit={handleSaveNews} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Başlık (Zorunlu)</label>
                <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Kategori Etiketi</label>
                <input required type="text" value={newBadge} onChange={e => setNewBadge(e.target.value)} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Gösterilecek Sayfa</label>
                <select value={newTargetPage} onChange={e => setNewTargetPage(e.target.value)} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-sky-500">
                  <option value="all">Her İki Sayfada</option>
                  <option value="iddaa">Sadece İddaa Sayfasında</option>
                  <option value="spor-toto">Sadece Spor Toto Sayfasında</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Açıklama Detayı (Zorunlu)</label>
              <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Buton Yazısı</label>
                <input required type="text" value={newButtonText} onChange={e => setNewButtonText(e.target.value)} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Buton Aksiyonu (Tıklanınca)</label>
                <select value={newButtonAction} onChange={e => setNewButtonAction(e.target.value)} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-sky-500">
                  <option value="modal:video">Video Modalını Aç (Eğitim)</option>
                  <option value="tab:create">Kupon Hazırlama Sayfasına Git</option>
                  <option value="none">Sadece Yazı (Tıklanmaz)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Arka Plan Resim URL (Opsiyonel)</label>
                <input type="text" value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            
            <div className="pt-2 flex justify-end">
              <button type="submit" className="flex items-center space-x-2 px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition">
                <Save className="h-4 w-4" />
                <span>{editingId ? 'Değişiklikleri Kaydet' : 'Kaydet ve Yayınla'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-800 pb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
        >
          Tüm Haberler
        </button>
        <button
          onClick={() => setActiveTab('iddaa')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'iddaa' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
        >
          İddaa Haberleri
        </button>
        <button
          onClick={() => setActiveTab('spor-toto')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'spor-toto' ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
        >
          Spor Toto Haberleri
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10 text-neutral-500">Haberler yükleniyor...</div>
        ) : news.filter(item => {
          if (activeTab === 'all') return !item.target_page || item.target_page === 'all';
          if (activeTab === 'iddaa') return item.target_page === 'iddaa';
          if (activeTab === 'spor-toto') return item.target_page === 'spor-toto';
          return true;
        }).length === 0 ? (
          <div className="text-center py-10 text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-xl">
            Bu kategoride henüz haber eklenmemiş.
          </div>
        ) : (
          news.filter(item => {
            if (activeTab === 'all') return !item.target_page || item.target_page === 'all';
            if (activeTab === 'iddaa') return item.target_page === 'iddaa';
            if (activeTab === 'spor-toto') return item.target_page === 'spor-toto';
            return true;
          }).map((item) => (
            <div key={item.id} className={`flex flex-col sm:flex-row gap-4 p-5 rounded-xl border transition ${item.is_active ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-950 border-neutral-800 opacity-60'}`}>
              
              {/* Image Preview */}
              <div className="w-full sm:w-48 h-32 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative border border-neutral-700">
                {item.bg_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.bg_image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-neutral-600" />
                )}
                {!item.is_active && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">YAYINDA DEĞİL</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">{item.badge_text}</span>
                    {item.target_page === 'iddaa' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">İddaa Sayfası</span>
                    )}
                    {item.target_page === 'spor-toto' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Spor Toto Sayfası</span>
                    )}
                    {(!item.target_page || item.target_page === 'all') && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-700 text-neutral-300">Tüm Sayfalar</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                  <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{item.description}</p>
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                  <button 
                    onClick={() => startEdit(item)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Düzenle</span>
                  </button>

                  <button 
                    onClick={() => toggleStatus(item.id, item.is_active)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${item.is_active ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                  >
                    {item.is_active ? (
                      <><XCircle className="h-3.5 w-3.5" /><span>Yayından Kaldır</span></>
                    ) : (
                      <><CheckCircle className="h-3.5 w-3.5" /><span>Yayına Al</span></>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => deleteNews(item.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Sil</span>
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
