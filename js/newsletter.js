// Newsletter functionality
export function initNewsletter() {
    const newsletterForms = document.querySelectorAll('.newsletter-form, form[class*="newsletter"]');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            if (!emailInput) return;
            
            const email = emailInput.value.trim();
            
            // Validate email
            if (!isValidEmail(email)) {
                showToast('❌ Please enter a valid email address', 'error');
                return;
            }
            
            try {
                // Get existing emails
                let emails = JSON.parse(localStorage.getItem('bindaud_newsletter_emails') || '[]');
                
                // Check for duplicates
                if (emails.includes(email)) {
                    showToast('✓ You\'re already subscribed!', 'info');
                    return;
                }
                
                // Add new email
                emails.push(email);
                localStorage.setItem('bindaud_newsletter_emails', JSON.stringify(emails));
                
                showToast('✓ Thank you for subscribing! Check your email for updates.', 'success');
                emailInput.value = '';
                
            } catch (err) {
                console.error('Newsletter subscription error:', err);
                showToast('✗ Error subscribing. Please try again.', 'error');
            }
        });
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showToast(message, type = 'info') {
    // Use existing toast system if available
    if (window.showToast && typeof window.showToast === 'function') {
        window.showToast(message);
    } else {
        // Fallback
        console.log(message);
    }
}
