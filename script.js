// 交互脚本（封面第一帧 + 播放按钮 + 弹窗播放器）
(function(){
  // 使用本地资源路径，不做跨域重写
  // Header 交互与分类筛选（保留原有逻辑）
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', ()=>{
      const y = window.scrollY;
      header.style.boxShadow = y>10? '0 6px 16px rgba(0,0,0,.06)':'none';
    });
  }
  const tabs = document.querySelectorAll('.portfolio-toolbar .tab');
  const cards = document.querySelectorAll('.work-card');
  function applyFilter(type){
    cards.forEach(card=>{
      const cat = card.getAttribute('data-category');
      const show = type==='all' || type===cat;
      card.style.opacity = 0;
      setTimeout(()=>{
        card.style.display = show? 'block':'none';
        setTimeout(()=>{ if(show) card.style.opacity = 1; }, 50);
      }, 100);
    });
  }
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      applyFilter(tab.dataset.filter);
    });
  });
  applyFilter('all');

  // 强制排序：微电影区块按指定关键词顺序排序
  (function sortMicroFilms(){
    const list = document.querySelector('.portfolio-row');
    if(!list) return;
    const orderKeys = ['Seedance', '天九', '仙侠', '都市超能力', '儿童系列'];
    const getRank = (card)=>{
      const title = (card.querySelector('.work-head h3')?.textContent || '');
      for(let i=0;i<orderKeys.length;i++){
        if(title.includes(orderKeys[i])) return i;
      }
      return orderKeys.length;
    };
    const cards = Array.from(list.querySelectorAll('.work-card'));
    cards.sort((a,b)=> getRank(a) - getRank(b));
    cards.forEach(c=> list.appendChild(c));
  })();

  // 入场动画
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  },{threshold:.15});
  cards.forEach(c=>io.observe(c));

  // 顶部导航：移动端菜单展开/收起
  const siteHeaderEl = document.querySelector('.site-header');
  const navToggle = siteHeaderEl ? siteHeaderEl.querySelector('.nav-toggle') : null;
  const siteNavEl = siteHeaderEl ? siteHeaderEl.querySelector('#site-nav') : null;
  if(navToggle && siteHeaderEl){
    navToggle.addEventListener('click', ()=>{
      const open = siteHeaderEl.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // 链接点击后收起菜单，避免遮挡内容与锚点定位偏差
    if(siteNavEl){
      siteNavEl.querySelectorAll('a[href^="#"]').forEach(a=>{
        a.addEventListener('click', ()=>{
          siteHeaderEl.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded','false');
        });
      });
    }
    // 视口尺寸变化时复位
    window.addEventListener('resize', ()=>{
      if(window.innerWidth > 640){
        siteHeaderEl.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded','false');
      }
    });
  }

  // 侧边导航滚动高亮（Scrollspy）
  const sideNav = document.querySelector('.side-nav');
  if(sideNav){
    const links = Array.from(sideNav.querySelectorAll('a[href^="#"]'));
    const sections = links.map(a=> document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const setActive = (id)=>{
      links.forEach(a=> a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    };
    const spy = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ setActive(e.target.id); } });
    },{ rootMargin: '-40% 0px -40% 0px', threshold: 0.01 });
    sections.forEach(sec=> spy.observe(sec));

    // 侧边导航出现时机：划过 Banner 后再显示
    const heroSection = document.querySelector('.hero');
    const siteHeader = document.querySelector('.site-header');
    const updateSideNavVisibility = ()=>{
      if(!heroSection){ return; }
      const headerH = (siteHeader && siteHeader.offsetHeight) ? siteHeader.offsetHeight : 64;
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight - headerH;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const shouldShow = y >= heroBottom;
      sideNav.classList.toggle('visible', shouldShow);
    };
    window.addEventListener('scroll', updateSideNavVisibility, { passive: true });
    window.addEventListener('resize', updateSideNavVisibility);
    updateSideNavVisibility();
  }

  // 英雄图轻视差（若存在）
  const heroImg = document.querySelector('.hero-art img');
  if(heroImg){
    const disableOnSmall = window.matchMedia('(max-width: 640px)').matches || window.matchMedia('(pointer: coarse)').matches;
    if(!disableOnSmall){
      window.addEventListener('scroll', ()=>{
        const y = window.scrollY; heroImg.style.transform = `translateY(${y*0.06}px) scale(1.02)`;
      });
    } else {
      heroImg.style.transform = '';
    }
  }

  // 回到顶部按钮：滚动显隐与平滑滚动
  const backTopBtn = document.querySelector('.back-top');
  if(backTopBtn){
    const toggleBackTop = ()=>{
      const y = window.scrollY; backTopBtn.classList.toggle('show', y > 400);
    };
    window.addEventListener('scroll', toggleBackTop);
    toggleBackTop();
    backTopBtn.addEventListener('click', ()=>{ window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // 弹窗播放器
  const modal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalClose = modal ? modal.querySelector('.modal-close') : null;
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;
  // 图片弹窗（Lightbox）
  const imageModal = document.getElementById('imageModal');
  const modalImage = imageModal ? document.getElementById('modalImage') : null;
  const imageClose = imageModal ? imageModal.querySelector('.modal-close') : null;
  const imageBackdrop = imageModal ? imageModal.querySelector('.modal-backdrop') : null;
  const imagePrev = imageModal ? imageModal.querySelector('.prev') : null;
  const imageNext = imageModal ? imageModal.querySelector('.next') : null;
  let lightboxImages = []; let lightboxIndex = 0;
  function openImageLightbox(list, index){
    if(!imageModal||!modalImage) return;
    lightboxImages = list || [];
    lightboxIndex = Math.max(0, Math.min(index||0, lightboxImages.length-1));
    const cur = lightboxImages[lightboxIndex]; if(!cur) return;
    modalImage.src = cur.url; modalImage.alt = cur.title||'';
    imageModal.classList.add('open'); imageModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeImageLightbox(){ if(!imageModal||!modalImage) return; imageModal.classList.remove('open'); imageModal.setAttribute('aria-hidden','true'); modalImage.removeAttribute('src'); document.body.style.overflow = ''; }
  function shiftImage(delta){ if(!lightboxImages.length) return; lightboxIndex = (lightboxIndex + delta + lightboxImages.length) % lightboxImages.length; const cur = lightboxImages[lightboxIndex]; if(cur){ modalImage.src = cur.url; modalImage.alt = cur.title||''; } }
  if(imageClose) imageClose.addEventListener('click', closeImageLightbox);
  if(imageBackdrop) imageBackdrop.addEventListener('click', closeImageLightbox);
  if(imagePrev) imagePrev.addEventListener('click', ()=> shiftImage(-1));
  if(imageNext) imageNext.addEventListener('click', ()=> shiftImage(1));
  window.addEventListener('keydown', (e)=>{
    // 仅在图片弹窗开启时响应键盘
    const imgOpen = imageModal && imageModal.classList.contains('open');
    if(!imgOpen) return;
    if(e.key==='Escape') closeImageLightbox();
    else if(e.key==='ArrowLeft') shiftImage(-1);
    else if(e.key==='ArrowRight') shiftImage(1);
  });
  function openVideo(url){
    if(!modal||!modalVideo) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    // 防下载属性（多浏览器兼容尝试）
    modalVideo.setAttribute('controlsList','nodownload');
    modalVideo.setAttribute('disablepictureinpicture','');
    // 设置播放源
    modalVideo.src = url;
    modalVideo.currentTime = 0;
    modalVideo.play().catch(()=>{});
    document.body.style.overflow = 'hidden';
  }
  function closeVideo(){ if(!modal||!modalVideo) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); modalVideo.pause(); modalVideo.removeAttribute('src'); modalVideo.load(); document.body.style.overflow = ''; }
  if(modalClose) modalClose.addEventListener('click', closeVideo);
  if(modalBackdrop) modalBackdrop.addEventListener('click', closeVideo);
  window.addEventListener('keydown', (e)=>{
    if(e.key==='Escape') closeVideo();
    // 拦截保存快捷键（仅弹窗打开时）
    const modalOpen = modal && modal.classList.contains('open');
    if(modalOpen && ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s')){
      e.preventDefault();
    }
  });
  // 拦截弹窗区域的右键菜单
  if(modal){
    modal.addEventListener('contextmenu',(e)=>{
      if(modal.classList.contains('open')) e.preventDefault();
    });
  }

  // 封面海报回退：若自定义海报不存在，回退到通用占位图
  function applyPosterWithFallback(v){
    // 使用本地占位图文件（位于 posters 文件夹）
    const placeholder = 'assets/images/posters/video-placeholder.svg';
    const desired = (v && v.dataset && v.dataset.poster) ? v.dataset.poster : null;
    if(desired){
      const img = new Image();
      img.onload = function(){ v.poster = desired; v.classList.add('ready'); };
      img.onerror = function(){ v.poster = placeholder; v.classList.add('ready'); };
      img.src = desired;
    }else{
      v.poster = placeholder;
      v.classList.add('ready');
    }
  }

  // 封面视频：懒加载海报 + 播放按钮（适用于所有区块）
  const coverVideos = document.querySelectorAll('.work-card .cover video');
  if(coverVideos.length){
    // 立即尝试应用海报，避免此前已被占位图覆盖的元素不再更新
    coverVideos.forEach(v=>{ if(v && !v.classList.contains('ready')) applyPosterWithFallback(v); });
    const preloadInView = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const v = e.target;
          // 使用海报回退逻辑，避免自定义海报缺失出现空白
          applyPosterWithFallback(v);
          preloadInView.unobserve(v);
        }
      });
    },{rootMargin:'200px 0px', threshold:0.01});
    coverVideos.forEach(v=>preloadInView.observe(v));
  }
  // 叠加可点击播放按钮（动态创建，适用于所有作品卡片）
  document.querySelectorAll('.work-card').forEach(card=>{
    const cover = card.querySelector('.cover');
    const v = cover ? cover.querySelector('video') : null;
    const url = (v && v.dataset && v.dataset.src) ? v.dataset.src : null;
    // 仅视频卡片显示播放按钮与点击播放
    if(cover && v && !cover.querySelector('.cover-play')){
      const btn = document.createElement('button'); btn.className = 'cover-play'; btn.setAttribute('aria-label','播放'); btn.textContent = '▶'; cover.appendChild(btn);
      btn.addEventListener('click',(ev)=>{ ev.stopPropagation(); if(url) openVideo(url); });
    }
    if(cover && v && url){ cover.addEventListener('click', ()=> openVideo(url)); }
    const action = card.querySelector('.work-actions a.btn.small');
    if(action && url){ action.addEventListener('click', (ev)=>{ ev.preventDefault(); openVideo(url); }); }
  });

  // 动态从 TOS 文件夹 manifest 加载卡片（文件夹名即板块名）
  async function loadSectionFromManifest(grid){
    const base = grid.dataset.source;
    if(!base) return;
    const manifestUrl = encodeURI((base.endsWith('/') ? base : base+'/') + 'manifest.json');
    const isDesign = grid.classList.contains('design');
    try{
      const res = await fetch(manifestUrl, { cache:'no-cache' });
      let items = [];
      if(res.ok){
        const data = await res.json();
        items = Array.isArray(data.items) ? data.items : [];
      }
      // 设计区回退：manifest 无效或为空时，自动生成若干图片项
      if(isDesign && items.length === 0){
        items = Array.from({length:13}, (_,i)=>({ file: `平面 ${i+1}.jpeg`, title: `平面 ${i+1}`, type:'image' }));
      }
      if(items.length === 0) return;
      // 清空现有静态卡片
      grid.innerHTML = '';
      const sectionTitle = grid.closest('.portfolio-section')?.querySelector('h3')?.textContent || '';
      // 懒加载视频
      const preloadInViewVideo = new IntersectionObserver(entries=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            const v = e.target;
            // 为动态视频在进入视窗时设置封面（带回退）
            applyPosterWithFallback(v);
            if(!v.getAttribute('src') && v.dataset.src){
              v.preload = 'metadata'; v.src = v.dataset.src;
              v.addEventListener('loadeddata', ()=> v.classList.add('ready'), {once:true});
            }
            preloadInViewVideo.unobserve(v);
          }
        });
      },{rootMargin:'200px 0px', threshold:0.01});
      // 懒加载图片
      const lazyImagesIO = new IntersectionObserver(entries=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            const img = e.target; if(!img.src && img.dataset.src){ img.src = img.dataset.src; }
            lazyImagesIO.unobserve(img);
          }
        });
      },{rootMargin:'200px 0px', threshold:0.01});
      const buildUrl = (b, file)=>{
        const baseEnc = encodeURI(b.endsWith('/')? b : b+'/');
        const fileEnc = file.split('/').map(encodeURIComponent).join('/');
        return baseEnc + fileEnc;
      };
      items.forEach(item=>{
        const title = item.title || (item.file || '').replace(/\.[^/.]+$/,'');
        const file = item.file || '';
        const url = buildUrl(base, file);
        const isVideo = (item.type === 'video') || /\.mp4$/i.test(file);
        const art = document.createElement('article');
        art.className = 'card work-card';
        art.setAttribute('data-category', sectionTitle);
        const cover = document.createElement('div');
        // 设计区不使用固定比例，避免裁剪
        cover.className = 'cover gradient' + (isDesign ? '' : (' ' + (item.ratio === 'portrait' ? 'portrait' : 'landscape')));
        let head = null;
        if(title){
          head = document.createElement('div'); head.className = 'work-head';
          const h3 = document.createElement('h3'); h3.textContent = title; head.appendChild(h3);
        }
        if(isVideo){
          const v = document.createElement('video');
          v.setAttribute('muted',''); v.setAttribute('playsinline',''); v.preload = 'none'; v.dataset.src = url;
          // 支持自定义海报；如果 manifest 中提供 poster 字段则使用，否则用占位图
          if(item.poster){
            const posterUrl = buildUrl(base, item.poster);
            v.dataset.poster = posterUrl;
          }
          cover.appendChild(v);
          art.appendChild(cover); if(head) art.appendChild(head);
          grid.appendChild(art);
          // 懒加载与播放交互绑定（仅视频）
          preloadInViewVideo.observe(v);
          if(!cover.querySelector('.cover-play')){
            const btn = document.createElement('button'); btn.className = 'cover-play'; btn.setAttribute('aria-label','播放'); btn.textContent = '▶'; cover.appendChild(btn);
            btn.addEventListener('click',(ev)=>{ ev.stopPropagation(); openVideo(url); });
          }
          cover.addEventListener('click', ()=> openVideo(url));
        }else{
          // 图片：不裁剪，懒加载
          const img = document.createElement('img'); img.loading = 'lazy'; img.dataset.src = url; img.alt = title || '';
          cover.appendChild(img);
          art.appendChild(cover); if(head) art.appendChild(head);
          grid.appendChild(art);
          lazyImagesIO.observe(img);
        }
      });
    }catch(err){
      console.warn('动态加载失败:', err);
      // 设计区最终回退：保留原页面中的首图结构即可
    }
  }
  // 初始化：扫描有 data-source 的区块并尝试动态渲染
  document.querySelectorAll('.portfolio-grid[data-source]').forEach(grid=>{ loadSectionFromManifest(grid); });
  // 设计瀑布流：从 manifest 加载图片并初始化
  document.querySelectorAll('.design-masonry[data-source]').forEach(container=>{ initDesignMasonryFromManifest(container); });

  function initCarouselLazy(carousel){
    const imgs = carousel.querySelectorAll('.slide .media img');
    if(!imgs.length) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ const img = e.target; if(!img.src && img.dataset.src){ img.src = img.dataset.src; } io.unobserve(img); }
      });
    },{root: null, rootMargin:'150px 0px', threshold:0.01});
    imgs.forEach(img=> io.observe(img));
  }

  function initDesignLazy(container){
    const imgs = container.querySelectorAll('img[data-src]');
    if(!imgs.length) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ const img = e.target; if(!img.src && img.dataset.src){ img.src = img.dataset.src; } io.unobserve(img); }
      });
    },{root: container.closest('.design-frame')||null, rootMargin:'200px 0px', threshold:0.01});
    imgs.forEach(img=> io.observe(img));
  }

  async function initDesignMasonryFromManifest(container){
    const base = container.dataset.source; if(!base) return;
    const manifestUrl = encodeURI((base.endsWith('/') ? base : base+'/') + 'manifest.json');
    const buildUrl = (b, file)=>{
      const baseEnc = encodeURI(b.endsWith('/')? b : b+'/');
      const fileEnc = file.split('/').map(encodeURIComponent).join('/');
      return baseEnc + fileEnc;
    };
    try{
      const res = await fetch(manifestUrl, { cache:'no-cache' });
      let items = [];
      if(res.ok){ const data = await res.json(); items = Array.isArray(data.items) ? data.items : []; }
      if(items.length === 0){ items = Array.from({length:13}, (_,i)=>({ file: `平面 ${i+1}.jpeg`, title: `平面 ${i+1}` })); }
      container.innerHTML = '';
      const gallery = items.map(item=>{
        const file = item.file || ''; const title = item.title || file.replace(/\.[^/.]+$/,'');
        const url = buildUrl(base, file);
        return { url, title };
      });
      gallery.forEach((meta, i)=>{
        const img = document.createElement('img'); img.loading = 'lazy'; img.alt = meta.title; img.dataset.src = meta.url; img.dataset.index = String(i);
        container.appendChild(img);
      });
      initDesignLazy(container);
      // 点击图片打开弹窗并支持前后切换
      container.addEventListener('click', (e)=>{
        const target = e.target; if(!(target instanceof Element)) return;
        if(target.tagName.toLowerCase()==='img'){
          const i = parseInt(target.dataset.index||'0', 10) || 0;
          openImageLightbox(gallery, i);
        }
      });
    }catch(err){
      // 瀑布流回退：直接生成若干图片
      const items = Array.from({length:13}, (_,i)=>({ file: `平面 ${i+1}.jpeg`, title: `平面 ${i+1}` }));
      container.innerHTML = '';
      const gallery = items.map(item=>({ url: buildUrl(base, item.file), title: item.title }));
      gallery.forEach((meta, i)=>{
        const img = document.createElement('img'); img.loading = 'lazy'; img.alt = meta.title; img.dataset.src = meta.url; img.dataset.index = String(i);
        container.appendChild(img);
      });
      initDesignLazy(container);
      container.addEventListener('click', (e)=>{
        const target = e.target; if(!(target instanceof Element)) return;
        if(target.tagName.toLowerCase()==='img'){
          const i = parseInt(target.dataset.index||'0', 10) || 0;
          openImageLightbox(gallery, i);
        }
      });
      console.warn('设计瀑布流动态加载失败，已使用回退:', err);
    }
  }

  // 旧的设计轮播保留但不再使用
  async function initCarouselFromManifest(carousel){
    const base = carousel.dataset.source;
    if(!base) return;
    const manifestUrl = encodeURI((base.endsWith('/') ? base : base+'/') + 'manifest.json');
    try{
      const res = await fetch(manifestUrl, { cache:'no-cache' });
      let items = [];
      if(res.ok){
        const data = await res.json();
        items = Array.isArray(data.items) ? data.items : [];
      }
      // 本地回退：manifest 不可用或为空时，自动生成 13 张图片
      if(items.length === 0){
        items = Array.from({length:13}, (_,i)=>({ file: `平面 ${i+1}.jpeg`, title: `平面 ${i+1}` }));
      }
      // 清空现有内容并重建结构
      carousel.innerHTML = '';
      const track = document.createElement('div'); track.className = 'carousel-track';
      const nav = document.createElement('div'); nav.className = 'carousel-nav';
      const prev = document.createElement('button'); prev.className = 'prev'; prev.setAttribute('aria-label','上一张'); prev.textContent = '‹';
      const next = document.createElement('button'); next.className = 'next'; next.setAttribute('aria-label','下一张'); next.textContent = '›';
      nav.appendChild(prev); nav.appendChild(next);
      const buildUrl = (b, file)=>{
        const baseEnc = encodeURI(b.endsWith('/')? b : b+'/');
        const fileEnc = file.split('/').map(encodeURIComponent).join('/');
        return baseEnc + fileEnc;
      };
      // 预加载以判定尺寸与方向
      const classifyLabel = (r)=>{
        const presets = [ {label:'21:9', val:21/9}, {label:'16:9', val:16/9}, {label:'3:2', val:1.5}, {label:'4:3', val:4/3} ];
        let best = {label:'other', diff: Infinity};
        presets.forEach(p=>{ const d = Math.abs(r - p.val); if(d < best.diff){ best = {label:p.label, diff:d}; } });
        return best.diff <= 0.08 ? best.label : 'other';
      };
      const metas = await Promise.all(items.map(item=> new Promise(resolve=>{
        const file = item.file || '';
        const title = item.title || file.replace(/\.[^/.]+$/,'');
        const url = buildUrl(base, file);
        const probe = new Image(); probe.decoding = 'async'; probe.loading = 'eager'; probe.src = url;
        const done = ()=>{
          const w = probe.naturalWidth || 0; const h = probe.naturalHeight || 0;
          const orientation = w>h ? 'landscape' : (w<h ? 'portrait' : (w===0||h===0 ? 'unknown' : 'square'));
          const ratio = h>0 ? (w/h) : 0; const label = ratio>0 ? classifyLabel(ratio) : 'unknown';
          resolve({ file, title, url, w, h, orientation, ratio, label });
        };
        probe.onload = done; probe.onerror = done;
      })));
      const landscape = metas.filter(m=> m.orientation==='landscape');
      let chosenLabel = '16:9';
      if(landscape.length){
        const counts = landscape.reduce((acc,m)=>{ acc[m.label] = (acc[m.label]||0)+1; return acc; },{});
        const typical = ['21:9','16:9','3:2','4:3'];
        const topTypical = typical.map(l=>[l, counts[l]||0]).sort((a,b)=> b[1]-a[1])[0];
        chosenLabel = topTypical[1] ? topTypical[0] : (Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '16:9');
      }
      const selected = landscape.filter(m=> m.label === chosenLabel);
      const others = metas.filter(m=> !selected.includes(m));
      // 构建轮播：仅放多数尺寸的横版
      const slides = selected.map(meta=>{
        const slide = document.createElement('div'); slide.className = 'slide';
        const media = document.createElement('div'); media.className = 'media';
        const img = document.createElement('img'); img.dataset.src = meta.url; img.loading = 'lazy'; img.alt = meta.title;
        media.appendChild(img); slide.appendChild(media); return slide;
      });
      slides.forEach(s=> track.appendChild(s));
      carousel.appendChild(track); carousel.appendChild(nav);

      // 生成下方网格：非横版或非多数尺寸的图片
      if(others.length){
        const section = carousel.parentElement;
        let below = section.querySelector('.design-others');
        if(!below){ below = document.createElement('div'); below.className = 'design-others'; section.appendChild(below); }
        below.innerHTML = '';
        others.forEach(meta=>{
          const fig = document.createElement('figure'); fig.className = 'design-item';
          const image = document.createElement('img'); image.loading = 'lazy'; image.src = meta.url; image.alt = meta.title;
          fig.appendChild(image); below.appendChild(fig);
        });
      }

      // 懒加载可视图
      initCarouselLazy(carousel);
      // 简单切换逻辑
      let index = 0; const max = slides.length;
      const isDesign = carousel.classList.contains('design');
      let update;
      // Coverflow（设计区）：居中放大 + 两侧旋转 + 深度
      if(isDesign){
        update = ()=>{
          const slideW = slides[0]?.offsetWidth || carousel.clientWidth;
          const gapRaw = getComputedStyle(track).gap || '24px';
          const gap = parseFloat(gapRaw) || 24;
          const containerW = carousel.clientWidth;
          const baseX = (containerW - slideW)/2;
          track.style.transition = 'transform .45s cubic-bezier(.22,.84,.36,1)';
          track.style.transform = `translateX(${baseX - index*(slideW+gap)}px)`;
          slides.forEach((s,i)=>{
            const off = i - index;
            const abs = Math.abs(off);
            const rotate = Math.max(-22, Math.min(22, off*18));
            const scale = off===0 ? 1 : 0.88;
            const depth = -Math.min(120, abs*90);
            s.style.transform = `translateZ(${depth}px) rotateY(${rotate}deg) scale(${scale})`;
            s.style.opacity = abs>2 ? 0.35 : 1;
            s.style.filter = abs>1 ? 'blur(0.6px)' : 'none';
            s.style.zIndex = String(100 - abs);
          });
          ensureLoaded(index);
        };
      }else{
        // 默认：整页横向切换
        update = ()=>{ track.style.transform = `translateX(-${index*100}%)`; ensureLoaded(index); };
      }
      const ensureLoaded = (i)=>{
        const img = slides[i]?.querySelector('img'); if(img && !img.src && img.dataset.src){ img.src = img.dataset.src; }
        const neighbor = slides[(i+1)%max]?.querySelector('img'); if(neighbor && !neighbor.src && neighbor.dataset.src){ neighbor.src = neighbor.dataset.src; }
      };
      prev.addEventListener('click', ()=>{ index = (index-1+max)%max; update(); restartAuto(); });
      next.addEventListener('click', ()=>{ index = (index+1)%max; update(); restartAuto(); });
      // 键盘切换（当容器在视口中）
      const onKey = (e)=>{
        const rect = carousel.getBoundingClientRect(); const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if(!inView) return; if(e.key==='ArrowLeft'){ prev.click(); } else if(e.key==='ArrowRight'){ next.click(); }
      };
      window.addEventListener('keydown', onKey);
      // 设计区：拖拽切换
      if(isDesign){
        let dragging = false, startX = 0, dragX = 0;
        const onDown = (e)=>{ dragging = true; startX = e.clientX; stopAuto(); track.style.transition = 'none'; };
        const onMove = (e)=>{
          if(!dragging) return;
          dragX = e.clientX - startX;
          const slideW = slides[0]?.offsetWidth || carousel.clientWidth;
          const gapRaw = getComputedStyle(track).gap || '24px';
          const gap = parseFloat(gapRaw) || 24;
          const containerW = carousel.clientWidth;
          const baseX = (containerW - slideW)/2;
          track.style.transform = `translateX(${baseX - index*(slideW+gap) + dragX}px)`;
        };
        const onUp = ()=>{
          if(!dragging) return;
          dragging = false;
          track.style.transition = 'transform .45s cubic-bezier(.22,.84,.36,1)';
          if(Math.abs(dragX) > 60){ index = dragX < 0 ? (index+1)%max : (index-1+max)%max; }
          dragX = 0; update(); startAuto();
        };
        track.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('resize', update);
      }
      update();
      // 自动播放（鼠标悬浮暂停）
      let timer = null;
      const startAuto = ()=>{ if(timer) return; timer = setInterval(()=>{ index = (index+1)%max; update(); }, isDesign ? 5000 : 4000); };
      const stopAuto = ()=>{ if(timer){ clearInterval(timer); timer = null; } };
      const restartAuto = ()=>{ stopAuto(); startAuto(); };
      carousel.addEventListener('mouseenter', stopAuto);
      carousel.addEventListener('mouseleave', startAuto);
      if(max > 1){ startAuto(); } else { nav.style.display = 'none'; }
    }catch(err){
      // 动态加载失败：仍使用本地回退 13 张图片
      try{
        const items = Array.from({length:13}, (_,i)=>({ file: `平面 ${i+1}.jpeg`, title: `平面 ${i+1}` }));
        // 递归一次以走统一渲染逻辑
        const fake = { items };
        // 清空现有内容并重建结构
        carousel.innerHTML = '';
        const track = document.createElement('div'); track.className = 'carousel-track';
        const nav = document.createElement('div'); nav.className = 'carousel-nav';
        const prev = document.createElement('button'); prev.className = 'prev'; prev.setAttribute('aria-label','上一张'); prev.textContent = '‹';
        const next = document.createElement('button'); next.className = 'next'; next.setAttribute('aria-label','下一张'); next.textContent = '›';
        nav.appendChild(prev); nav.appendChild(next);
        const buildUrl = (b, file)=>{
          const baseEnc = encodeURI(b.endsWith('/')? b : b+'/');
          const fileEnc = file.split('/').map(encodeURIComponent).join('/');
          return baseEnc + fileEnc;
        };
        const classifyLabel = (r)=>{
          const presets = [ {label:'21:9', val:21/9}, {label:'16:9', val:16/9}, {label:'3:2', val:1.5}, {label:'4:3', val:4/3} ];
          let best = {label:'other', diff: Infinity};
          presets.forEach(p=>{ const d = Math.abs(r - p.val); if(d < best.diff){ best = {label:p.label, diff:d}; } });
          return best.diff <= 0.08 ? best.label : 'other';
        };
        const metas = await Promise.all(fake.items.map(item=> new Promise(resolve=>{
          const file = item.file || '';
          const title = item.title || file.replace(/\.[^/.]+$/,'');
          const url = buildUrl(base, file);
          const probe = new Image(); probe.decoding = 'async'; probe.loading = 'eager'; probe.src = url;
          const done = ()=>{
            const w = probe.naturalWidth || 0; const h = probe.naturalHeight || 0;
            const orientation = w>h ? 'landscape' : (w<h ? 'portrait' : (w===0||h===0 ? 'unknown' : 'square'));
            const ratio = h>0 ? (w/h) : 0; const label = ratio>0 ? classifyLabel(ratio) : 'unknown';
            resolve({ file, title, url, w, h, orientation, ratio, label });
          };
          probe.onload = done; probe.onerror = done;
        })));
        const landscape = metas.filter(m=> m.orientation==='landscape');
        let chosenLabel = '16:9';
        if(landscape.length){
          const counts = landscape.reduce((acc,m)=>{ acc[m.label] = (acc[m.label]||0)+1; return acc; },{});
          const typical = ['21:9','16:9','3:2','4:3'];
          const topTypical = typical.map(l=>[l, counts[l]||0]).sort((a,b)=> b[1]-a[1])[0];
          chosenLabel = topTypical[1] ? topTypical[0] : (Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '16:9');
        }
        const selected = landscape.filter(m=> m.label === chosenLabel);
        const others = metas.filter(m=> !selected.includes(m));
        const slides = selected.map(meta=>{
          const slide = document.createElement('div'); slide.className = 'slide';
          const media = document.createElement('div'); media.className = 'media';
          const img = document.createElement('img'); img.dataset.src = meta.url; img.loading = 'lazy'; img.alt = meta.title;
          media.appendChild(img); slide.appendChild(media); return slide;
        });
        slides.forEach(s=> track.appendChild(s));
        carousel.appendChild(track); carousel.appendChild(nav);
        if(others.length){
          const section = carousel.parentElement;
          let below = section.querySelector('.design-others');
          if(!below){ below = document.createElement('div'); below.className = 'design-others'; section.appendChild(below); }
          below.innerHTML = '';
          others.forEach(meta=>{
            const fig = document.createElement('figure'); fig.className = 'design-item';
            const image = document.createElement('img'); image.loading = 'lazy'; image.src = meta.url; image.alt = meta.title;
            fig.appendChild(image); below.appendChild(fig);
          });
        }
        initCarouselLazy(carousel);
        let index = 0; const max = slides.length;
        const isDesign = carousel.classList.contains('design');
        const ensureLoaded = (i)=>{ const img = slides[i]?.querySelector('img'); if(img && !img.src && img.dataset.src){ img.src = img.dataset.src; } };
        let update;
        if(isDesign){
          update = ()=>{
            const slideW = slides[0]?.offsetWidth || carousel.clientWidth;
            const gapRaw = getComputedStyle(track).gap || '24px';
            const gap = parseFloat(gapRaw) || 24;
            const containerW = carousel.clientWidth;
            const baseX = (containerW - slideW)/2;
            track.style.transition = 'transform .45s cubic-bezier(.22,.84,.36,1)';
            track.style.transform = `translateX(${baseX - index*(slideW+gap)}px)`;
            slides.forEach((s,i)=>{
              const off = i - index;
              const abs = Math.abs(off);
              const rotate = Math.max(-22, Math.min(22, off*18));
              const scale = off===0 ? 1 : 0.88;
              const depth = -Math.min(120, abs*90);
              s.style.transform = `translateZ(${depth}px) rotateY(${rotate}deg) scale(${scale})`;
              s.style.opacity = abs>2 ? 0.35 : 1;
              s.style.filter = abs>1 ? 'blur(0.6px)' : 'none';
              s.style.zIndex = String(100 - abs);
            });
            ensureLoaded(index);
          };
        }else{
          update = ()=>{ track.style.transform = `translateX(-${index*100}%)`; ensureLoaded(index); };
        }
        prev.addEventListener('click', ()=>{ index = (index-1+max)%max; update(); });
        next.addEventListener('click', ()=>{ index = (index+1)%max; update(); });
        if(isDesign){ window.addEventListener('resize', update); }
        update();
      }catch(e){ console.warn('设计轮播回退渲染异常:', e); }
      console.warn('设计轮播动态加载失败，已使用回退:', err);
    }
  }
})();

// 背景：白色星辰粒子（有大有小，朦胧外发光，连接线）
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const host = document.getElementById('particles-js');
    if(!host) return;
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // 设备像素比适配，保证外发光清晰
    let dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    // 桌面端加速：指针为精细(pointer:fine)或宽度>=1024且非移动设备
    const isDesktopFast = window.matchMedia('(pointer: fine)').matches || (window.innerWidth >= 1024 && !/Mobi/i.test(navigator.userAgent));
    const speedFactor = isDesktopFast ? 1.8 : 1.0;       // 位移速度放大
    const twinkleFactor = isDesktopFast ? 1.6 : 1.0;     // 明暗呼吸速度放大
    function resize(){
      const w = window.innerWidth, h = window.innerHeight;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 用CSS像素绘制
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const baseDensity = 14000;
    const count = Math.min(220, Math.floor((window.innerWidth*window.innerHeight)/baseDensity));

    function rand(min, max){ return min + Math.random()*(max-min); }
    // 近似真实星色（按色温分布），并加入轻微去饱和与随机色差
    function pickStarColor(){
      const u = Math.random();
      let c;
      if(u < 0.18) c = [170+rand(-12,12), 205+rand(-10,10), 255];           // 蓝白（比例提升）
      else if(u < 0.38) c = [235+rand(-8,8), 242+rand(-8,8), 255];           // 中性偏冷白
      else if(u < 0.60) c = [255, 244+rand(-10,10), 234+rand(-10,10)];       // 黄白
      else if(u < 0.80) c = [255, 236+rand(-12,12), 200+rand(-12,12)];       // 黄色
      else if(u < 0.94) c = [255, 210+rand(-12,12), 170+rand(-12,12)];       // 橙色
      else c = [255, 185+rand(-12,12), 160+rand(-12,12)];                    // 红橙
      const desat = 0.06; // 轻微去饱和，贴近视觉真实
      const gray = (c[0]+c[1]+c[2])/3;
      c = c.map(v => Math.min(255, Math.max(0, Math.round(v*(1-desat) + gray*desat))));
      return { r: c[0]|0, g: c[1]|0, b: c[2]|0 };
    }

    function pickRadius(){
      const u = Math.random();
      if(u < 0.72) return 1.0 + Math.random()*1.6;    // 1.0 - 2.6（小星）
      if(u < 0.94) return 2.4 + Math.random()*2.0;    // 2.4 - 4.4（中星）
      return 4.8 + Math.random()*1.8;                 // 4.8 - 6.6（亮星更大但不“愣”）
    }
    for(let i=0; i<count; i++){
      const r = pickRadius();
      particles.push({
        x: Math.random()*window.innerWidth,
        y: Math.random()*window.innerHeight,
        r,
        vx: (Math.random()*0.36*speedFactor - 0.18*speedFactor),
        vy: (Math.random()*0.36*speedFactor - 0.18*speedFactor),
        bright: r >= 4.8,
        color: pickStarColor(),
        twinklePhase: Math.random()*Math.PI*2,
        twinkleSpeed: (0.5 + Math.random()*1.2) * twinkleFactor,
        twinkleAmp: r >= 4.8 ? 0.50 : (r >= 2.4 ? 0.27 : 0.12),
      });
    }

    const linkDist = 140; // 连接线阈值略增，画面更连贯

    function drawStar(p, alpha){
      // 使用 lighter 叠加增强柔光感
      const prevComp = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = `rgba(${p.color.r},${p.color.g},${p.color.b},${1.0*alpha})`;
      ctx.shadowBlur = (26 + p.r*3.4) * dpr; // 阴影半径提升，柔光更明显
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha})`;
      ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      ctx.globalCompositeOperation = prevComp;
    }

    function connect(){
      ctx.lineWidth = 0.8 / dpr; // 保持CSS像素下的线宽
      for(let i=0;i<particles.length;i++){
        const a = particles[i];
        for(let j=i+1;j<particles.length;j++){
          const b = particles[j];
          const dx = a.x - b.x; const dy = a.y - b.y; const d = Math.sqrt(dx*dx + dy*dy);
          if(d < linkDist){
            const t = 1 - d/linkDist;
            const lineAlpha = Math.max(0.06, 0.22 * t);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }

    function step(){
      // 在设备像素尺寸下清理画布
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.setTransform(dpr,0,0,dpr,0,0);

      for(const p of particles){
        p.x += p.vx; p.y += p.vy;
        // 边界穿越（CSS像素坐标）
        const W = window.innerWidth, H = window.innerHeight;
        if(p.x > W) p.x = 0; if(p.x < 0) p.x = W;
        if(p.y > H) p.y = 0; if(p.y < 0) p.y = H;

        // 基础透明度随尺寸提升
        let baseAlpha = Math.min(1, 0.34 + p.r*0.09);
        // 周期性明暗交替：所有星以不同强度呼吸，亮星更明显
        if(p.twinkleAmp > 0){
          p.twinklePhase += 0.014 * p.twinkleSpeed; // twinkleSpeed 已含桌面加速因子
          const s = 0.5 + 0.5*Math.sin(p.twinklePhase); // 0..1
          const sCurve = Math.pow(s, 1.8); // 非线性曲线，增强高光阶段
          const breathe = baseAlpha*(1-p.twinkleAmp) + baseAlpha*p.twinkleAmp*sCurve;
          baseAlpha = Math.min(1, breathe);
        }
        drawStar(p, baseAlpha);
      }

      connect();
      requestAnimationFrame(step);
    }
    step();
  });
})();
