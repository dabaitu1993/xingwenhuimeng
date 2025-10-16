// 交互脚本（封面第一帧 + 播放按钮 + 弹窗播放器）
(function(){
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

  // 英雄图轻视差（若存在）
  const heroImg = document.querySelector('.hero-art img');
  if(heroImg){
    window.addEventListener('scroll',()=>{
      const y = window.scrollY; heroImg.style.transform = `translateY(${y*0.06}px) scale(1.02)`;
    });
  }

  // 弹窗播放器
  const modal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalClose = modal ? modal.querySelector('.modal-close') : null;
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;
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

  // 微电影封面：懒加载 metadata 显示第一帧 + 播放按钮
  const coverVideos = document.querySelectorAll('.portfolio-row .cover video');
  if(coverVideos.length){
    const preloadInView = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const v = e.target; if(!v.getAttribute('src') && v.dataset.src){
            v.preload = 'metadata'; v.src = v.dataset.src;
            v.addEventListener('loadeddata', ()=> v.classList.add('ready'), {once:true});
          }
          preloadInView.unobserve(v);
        }
      });
    },{rootMargin:'200px 0px', threshold:0.01});
    coverVideos.forEach(v=>preloadInView.observe(v));
  }
  // 叠加可点击播放按钮（动态创建，便于样式与可访问性）
  document.querySelectorAll('.portfolio-row .work-card').forEach(card=>{
    const cover = card.querySelector('.cover');
    const v = cover ? cover.querySelector('video') : null;
    const url = (v && v.dataset && v.dataset.src) ? v.dataset.src : (card.querySelector('.work-actions a') ? card.querySelector('.work-actions a').href : null);
    if(cover && !cover.querySelector('.cover-play')){
      const btn = document.createElement('button'); btn.className = 'cover-play'; btn.setAttribute('aria-label','播放'); btn.textContent = '▶'; cover.appendChild(btn);
      btn.addEventListener('click',(ev)=>{ ev.stopPropagation(); if(url) openVideo(url); });
    }
    if(cover && url){ cover.addEventListener('click', ()=> openVideo(url)); }
    const action = card.querySelector('.work-actions a.btn.small');
    if(action && url){ action.addEventListener('click', (ev)=>{ ev.preventDefault(); openVideo(url); }); }
  });
})();
