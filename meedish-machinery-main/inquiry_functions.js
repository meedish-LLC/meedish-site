/**
 * Custom Machine Inquiry Functions
 * Handles opening, closing, and submitting the inquiry modal.
 */

/**
 * Opens the custom machine inquiry modal.
 */
function openInquiryModal() {
    const modal = document.getElementById('inquiryModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

/**
 * Closes the custom machine inquiry modal.
 */
function closeInquiryModal() {
    const modal = document.getElementById('inquiryModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
        resetInquiryForm();
    }
}

/**
 * Resets all fields in the inquiry form.
 */
function resetInquiryForm() {
    const fields = [
        'inquiryType', 'inquiryListingType', 'inquiryBrand', 'inquiryModel',
        'inquiryMinPrice', 'inquiryMaxPrice', 'inquirySpecs', 'inquiryStartDate',
        'inquiryDuration', 'inquiryName', 'inquiryEmail', 'inquiryPhone',
        'inquiryNotes', 'inquiryTerms'
    ];

    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = false;
            } else {
                field.value = '';
            }
        }
    });
}

/**
 * Validates and submits the inquiry data to Supabase.
 */
async function submitInquiry() {
    try {
        // Collect form data
        const data = {
            machine_type: document.getElementById('inquiryType').value,
            listing_type: document.getElementById('inquiryListingType').value,
            brand_preference: document.getElementById('inquiryBrand').value,
            model_year: document.getElementById('inquiryModel').value,
            min_price: document.getElementById('inquiryMinPrice').value ? parseFloat(document.getElementById('inquiryMinPrice').value) : null,
            max_price: document.getElementById('inquiryMaxPrice').value ? parseFloat(document.getElementById('inquiryMaxPrice').value) : null,
            specifications: document.getElementById('inquirySpecs').value,
            start_date: document.getElementById('inquiryStartDate').value || null,
            duration: document.getElementById('inquiryDuration').value,
            name: document.getElementById('inquiryName').value.trim(),
            email: document.getElementById('inquiryEmail').value.trim(),
            phone: document.getElementById('inquiryPhone').value.trim(),
            notes: document.getElementById('inquiryNotes').value,
            status: 'pending'
        };

        // Basic Validation
        if (!data.machine_type) return alert('Please select a machine type');
        if (!data.listing_type) return alert('Please select if you want to Rent or Buy');
        if (!data.name) return alert('Please enter your name');
        if (!data.email || !data.email.includes('@')) return alert('Please enter a valid email address');
        if (!data.phone) return alert('Please enter your phone number');

        if (!document.getElementById('inquiryTerms').checked) {
            alert('Please agree to the terms and communications');
            return;
        }

        // Show loading state
        const loadingSpinner = document.getElementById('inquiryLoading');
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');

        // Submit to Supabase
        const response = await window.supabase
            .from('machine_inquiries')
            .insert([data])
            .select(); // Force return of inserted data

        if (response.error) {
            console.error('Supabase error:', response.error);
            alert('Supabase Error: ' + response.error.message + '\nCode: ' + response.error.code + '\nDetails: ' + response.error.details);
            throw response.error;
        }
        // Check if data was actually inserted
        if (!response.data || response.data.length === 0) {
            console.warn('No data returned from insert - this may indicate RLS policy blocking');
            alert('Warning: Insert may have been blocked by database policies. Check browser console.');
        }

        // Success message
        alert('Thank you! Your inquiry has been submitted. Our team will contact you soon.');

        // Close modal
        closeInquiryModal();

    } catch (error) {
        console.error('Error submitting inquiry:', error);
        alert('Submission Failed: ' + error.message);
    } finally {
        // Hide loading state
        const loadingSpinner = document.getElementById('inquiryLoading');
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}
