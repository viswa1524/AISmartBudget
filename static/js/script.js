/**
 * PocketSmart AI - Client-side script
 * Handles mobile nav toggle and AI recommendation fetching.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Highlight active navigation item matching the current page
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('#main-nav a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });

  // 2. Mobile nav toggle
  const toggleBtn = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      const expanded = mainNav.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', expanded);
    });
  }

  // 3. AI Recommendation Button
  const recBtn = document.getElementById('get-recommendation-btn');
  const recResult = document.getElementById('recommendation-result');

  if (recBtn && recResult) {
    recBtn.addEventListener('click', async () => {
      recBtn.disabled = true;
      recBtn.textContent = 'Generating Recommendation...';
      recResult.style.display = 'block';
      recResult.className = 'recommendation-box';
      recResult.textContent = 'Analyzing your income, expenses, and budget with Gemini AI...';

      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success && data.recommendation) {
          recResult.className = 'recommendation-box';
          recResult.textContent = data.recommendation;
        } else {
          recResult.className = 'recommendation-box error';
          recResult.textContent = data.error || 'Could not generate recommendations. Please try again.';
        }
      } catch (err) {
        recResult.className = 'recommendation-box error';
        recResult.textContent = 'Network or server error while contacting AI service.';
      } finally {
        recBtn.disabled = false;
        recBtn.textContent = 'Get AI Recommendation';
      }
    });
  }
});
