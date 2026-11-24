/* Portfolio interactions — vanilla JavaScript, no build step required. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const projects = {
    p1: {
      category: 'SALES ANALYSIS',
      title: 'E-Commerce Sales Analysis',
      summary: 'Analysis of 1,000 sales records to explore sales, profit, product performance and regional trends.',
      problem: 'Understand how sales and profit vary across products and regions, and identify patterns that can support better business decisions.',
      methodology: 'The project uses Python and Pandas to inspect and prepare sales records, followed by SQL-style grouping and aggregation to compare sales, profit and regional performance.',
      outcomes: 'The dashboard highlights sales and profit trends, compares regional contribution and shows how product categories contribute to overall performance. Figures shown here are illustrative dashboard values, not audited business results.',
      technologies: ['Python', 'Pandas', 'SQL'],
      kpis: [['1,000', 'Records analyzed'], ['Sales & Profit', 'Key metrics'], ['Regional', 'Performance']],
      summaryChart: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [120, 155, 142, 190, 218, 245],
        label: 'Illustrative monthly sales index'
      },
      segmentChart: {
        labels: ['North', 'South', 'East', 'West'],
        data: [28, 24, 19, 29],
        label: 'Illustrative regional share'
      },
      categories: ['Technology', 'Furniture', 'Office Supplies'],
      categoryValues: [42, 33, 25]
    },
    p2: {
      category: 'FINANCIAL LOAN ANALYSIS',
      title: 'Bank Loan Data Analysis',
      summary: 'Exploration of loan applications, funded amounts, loan status and customer information.',
      problem: 'Explore loan applications and funded amounts, understand loan-status distribution and examine customer information.',
      methodology: 'The project is in progress. The planned workflow uses Excel for initial inspection and cleaning, SQL for filtering and aggregation, and Power BI for interactive reporting.',
      outcomes: 'The dashboard preview demonstrates how application volume, funding and loan-status categories can be monitored. Values in the preview are sample values for interface demonstration, not verified project findings.',
      technologies: ['SQL', 'Excel', 'Power BI'],
      kpis: [['In Progress', 'Project status'], ['Applications', 'Volume tracked'], ['Funded Amount', 'Financial metric']],
      summaryChart: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [65, 82, 74, 105, 119, 132],
        label: 'Illustrative loan applications'
      },
      segmentChart: {
        labels: ['Approved', 'Current', 'Charged Off', 'Other'],
        data: [48, 27, 17, 8],
        label: 'Illustrative loan status share'
      },
      categories: ['Personal', 'Debt Consolidation', 'Home Improvement', 'Other'],
      categoryValues: [38, 32, 18, 12]
    }
  };

  let primaryChart = null;
  let secondaryChart = null;
  let activeProject = null;

  function showToast(message) {
    const toast = $('#toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // Mobile navigation
  const mobileToggle = $('#mobile-toggle');
  const navMenu = $('#nav-menu');

  mobileToggle?.addEventListener('click', () => {
    const opened = navMenu?.classList.toggle('open');
    mobileToggle.setAttribute('aria-expanded', String(Boolean(opened)));
    mobileToggle.innerHTML = opened
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars-staggered"></i>';
  });

  $$('.nav-link, .nav-menu a').forEach(link => link.addEventListener('click', () => {
    navMenu?.classList.remove('open');
    mobileToggle?.setAttribute('aria-expanded', 'false');
    if (mobileToggle) mobileToggle.innerHTML = '<i class="fa-solid fa-bars-staggered"></i>';
  }));

  // Project filters
  $$('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      $$('.filter-btn').forEach(item => item.classList.toggle('active', item === button));

      $$('.project-card').forEach(card => {
        const categories = (card.dataset.category || '').split(/\s+/);
        card.hidden = filter !== 'all' && !categories.includes(filter);
      });
    });
  });

  const modal = $('#project-modal');
  const modalClose = $('#modal-close-btn');
  const modalBody = $('.modal-scroll-body', modal || document);

  function destroyCharts() {
    if (primaryChart) {
      primaryChart.destroy();
      primaryChart = null;
    }

    if (secondaryChart) {
      secondaryChart.destroy();
      secondaryChart = null;
    }
  }

  function renderPills(items) {
    const container = $('#modal-tech-list');
    if (!container) return;

    container.replaceChildren();

    items.forEach(name => {
      const pill = document.createElement('span');
      pill.className = 'tech-pill';
      pill.textContent = name;
      container.appendChild(pill);
    });
  }

  function renderKpis(items) {
    const container = $('#modal-kpi-bar');
    if (!container) return;

    container.replaceChildren();

    items.forEach(([value, label]) => {
      const item = document.createElement('div');
      item.className = 'modal-kpi-item';

      const strong = document.createElement('strong');
      strong.textContent = value;

      const small = document.createElement('span');
      small.textContent = label;

      item.append(strong, small);
      container.appendChild(item);
    });
  }

  function chartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#cbd5e1',
            usePointStyle: true
          }
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(148,163,184,.10)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(148,163,184,.10)' }
        }
      }
    };
  }

  function drawCharts(project, period = 'view1') {
    if (!window.Chart) {
      showToast('Charts could not load. Check your internet connection and refresh.');
      return;
    }

    destroyCharts();

    const segment = period === 'view2';
    const line = $('#modalChartPrimary');
    const doughnut = $('#modalChartSecondary');

    if (!line || !doughnut) return;

    const first = segment ? project.segmentChart : project.summaryChart;
    const firstLabel = $('#chart1-label');
    const secondLabel = $('#chart2-label');

    if (firstLabel) firstLabel.textContent = first.label;
    if (secondLabel) secondLabel.textContent = 'Category breakdown (illustrative)';

    primaryChart = new Chart(line, {
      type: segment ? 'bar' : 'line',
      data: {
        labels: first.labels,
        datasets: [{
          label: first.label,
          data: first.data,
          borderColor: '#38bdf8',
          backgroundColor: segment
            ? 'rgba(56,189,248,.45)'
            : 'rgba(56,189,248,.14)',
          borderWidth: 2,
          fill: !segment,
          tension: .35,
          borderRadius: segment ? 7 : 0
        }]
      },
      options: chartOptions()
    });

    secondaryChart = new Chart(doughnut, {
      type: 'doughnut',
      data: {
        labels: project.categories,
        datasets: [{
          data: project.categoryValues,
          backgroundColor: ['#8b5cf6', '#06b6d4', '#3b82f6', '#f59e0b'],
          borderColor: '#0c0b1f',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              padding: 16
            }
          }
        }
      }
    });
  }

  function openProject(id) {
    const project = projects[id];
    if (!project || !modal) return;

    activeProject = id;

    $('#modal-category').textContent = project.category;
    $('#modal-title').textContent = project.title;
    $('#modal-summary').textContent = project.summary;
    $('#modal-problem').textContent = project.problem;
    $('#modal-methodology').textContent = project.methodology;
    $('#modal-outcomes').textContent = project.outcomes;

    renderKpis(project.kpis);
    renderPills(project.technologies);

    $$('.chart-filter-btn').forEach((button, index) => {
      button.classList.toggle('active', index === 0);
    });

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    if (modalBody) modalBody.scrollTop = 0;

    requestAnimationFrame(() => drawCharts(project, 'view1'));
    modalClose?.focus();
  }

  function closeProject() {
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    destroyCharts();
    activeProject = null;
  }

  $$('.btn-inspect-project').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();

      openProject(
        button.dataset.targetModal ||
        button.closest('.project-card')?.dataset.projectId
      );
    });
  });

  // Clicking a card body also opens its own project.
  $$('.project-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('a, button')) return;
      openProject(card.dataset.projectId);
    });
  });

  modalClose?.addEventListener('click', closeProject);

  modal?.addEventListener('click', event => {
    if (event.target === modal) closeProject();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal?.classList.contains('active')) {
      closeProject();
    }
  });

  $$('.chart-filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      if (!activeProject) return;

      $$('.chart-filter-btn').forEach(item => {
        item.classList.toggle('active', item === button);
      });

      drawCharts(
        projects[activeProject],
        button.dataset.period || 'view1'
      );
    });
  });

  // Contact form: validates fields and opens a pre-filled email.
  const contactForm = $('#contact-form');

  contactForm?.addEventListener('submit', event => {
    event.preventDefault();

    const name = $('#contact-name')?.value.trim() || '';
    const email = $('#contact-email')?.value.trim() || '';
    const type = $('#project-type')?.selectedOptions[0]?.textContent || 'General inquiry';
    const message = $('#contact-message')?.value.trim() || '';
    const feedback = $('#form-feedback');

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk || !message) {
      if (feedback) {
        feedback.textContent = 'Please enter your name, a valid email address and your message.';
        feedback.className = 'form-feedback error';
      }

      (
        !name
          ? $('#contact-name')
          : (!emailOk ? $('#contact-email') : $('#contact-message'))
      )?.focus();

      return;
    }

    const subject = encodeURIComponent(`${type} — message from ${name}`);

    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nOpportunity: ${type}\n\nMessage:\n${message}`
    );

    // Add the portfolio owner's email address here before publishing.
    const recipient = '';

    const mailto = `mailto:${recipient}?subject=${subject}&body=${body}`;

    if (feedback) {
      feedback.textContent = 'Your email app should open with the message ready. Review it and press Send there.';
      feedback.className = 'form-feedback success';
    }

    window.location.href = mailto;
  });

  // Typing headline
  const typing = $('#typing-text');

  if (typing) {
    const phrases = [
      'Data Analysis',
      'SQL & Python',
      'Interactive Dashboards',
      'Business Insights'
    ];

    let phrase = 0;
    let char = 0;
    let deleting = false;

    const typeNext = () => {
      const current = phrases[phrase];
      typing.textContent = current.slice(0, char);

      if (!deleting && char < current.length) {
        char++;
      } else if (deleting && char > 0) {
        char--;
      } else if (!deleting) {
        deleting = true;
        setTimeout(typeNext, 1200);
        return;
      } else {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
      }

      setTimeout(typeNext, deleting ? 45 : 85);
    };

    typeNext();
  }

  // Count-up metrics, only when visible.
  const counters = $$('.metric-number[data-target]');

  if ('IntersectionObserver' in window && counters.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const target = Number(el.dataset.target) || 0;
        const start = performance.now();
        const duration = 1100;

        const tick = now => {
          const progress = Math.min((now - start) / duration, 1);

          el.textContent = Math.round(
            target * (1 - Math.pow(1 - progress, 3))
          ).toLocaleString();

          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: .35 });

    counters.forEach(el => observer.observe(el));
  }

  // Lightweight animated background.
  const canvas = $('#bg-canvas');

  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    let points = [];
    let frame;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      points = Array.from(
        { length: Math.min(65, Math.floor(innerWidth / 18)) },
        () => ({
          x: Math.random() * innerWidth,
          y: Math.random() * innerHeight,
          vx: (Math.random() - .5) * .22,
          vy: (Math.random() - .5) * .22
        })
      );
    };

    const animate = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      points.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > innerHeight) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139,92,246,.55)';
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 115) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56,189,248,${.13 * (1 - dist / 115)})`;
            ctx.stroke();
          }
        }
      });

      frame = requestAnimationFrame(animate);
    };

    resize();
    animate();

    window.addEventListener('resize', resize, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
      } else {
        animate();
      }
    });
  }

  // Back-to-top button
  $('#back-to-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Navigation active state
  const sections = $$('main section[id]');

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        $$('.nav-link').forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });

    sections.forEach(section => navObserver.observe(section));
  }

  // Avoid page scroll behind the project dialog.
  const style = document.createElement('style');

  style.textContent = `
    body.modal-open { overflow: hidden; }
    .project-card[hidden] { display: none; }
    .toast-container.show {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  `;

  document.head.appendChild(style);
})();