/*
  BOOKING & WISHLIST JAVASCRIPT FUNCTIONS
  
  INSTRUCTIONS:
  Insert all functions below into the <script> section of index.html
  (before the closing </script> tag, around line 1730)
*/

// ========== GLOBAL VARIABLES ==========
let currentBookingMachineId = null;
let selectedFuelOption = null;
let selectedDeliveryOption = null;
let currentMachineData = null;

// ========== WISHLIST FUNCTIONS ==========
async function toggleWishlist(machineId) {
    try {
        // Use authenticated user id instead of prompting for email
        const session = await auth.getSession();
        if (!session || !session.user) {
            alert('Please log in to add items to your wishlist.');
            return;
        }
        const userId = session.user.id;

        // Check if already in wishlist
        const { data: existing, error: checkError } = await supabase
            .from('wishlist')
            .select('*')
            .eq('user_id', userId)
            .eq('machine_id', machineId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
            // Remove from wishlist
            const { error: deleteError } = await supabase
                .from('wishlist')
                .delete()
                .eq('id', existing.id);

            if (deleteError) throw deleteError;
            alert('✓ Removed from wishlist');
        } else {
            // Add to wishlist
            const { error: insertError } = await supabase
                .from('wishlist')
                .insert([{
                    user_id: userId,
                    machine_id: machineId
                }]);

            if (insertError) throw insertError;
            alert('✓ Added to wishlist!');
        }
    } catch (error) {
        console.error('Wishlist error:', error);
        alert('Failed to update wishlist. Please try again.');
    }
}

// ========== BOOKING MODAL FUNCTIONS ==========
async function openCompleteBookingModal(machineId) {
    currentBookingMachineId = machineId;

    // Fetch machine data
    const { data: machine, error } = await supabase
        .from('machines')
        .select('*')
        .eq('id', machineId)
        .single();

    if (error) {
        console.error('Error fetching machine:', error);
        alert('Failed to load machine details');
        return;
    }

    currentMachineData = machine;

    // Display modal
    const modal = document.getElementById('completeBookingModal');
    if (modal) {
        modal.classList.remove('hidden');

        // Reset form
        resetBookingForm();

        // Set original price
        document.getElementById('originalPriceDisplay').textContent = `$${machine.price}`;

        // Show step 1
        showStep(1);
    } else {
        alert('Booking modal not found. Please refresh the page.');
    }
}

function closeCompleteBookingModal() {
    const modal = document.getElementById('completeBookingModal');
    if (modal) {
        modal.classList.add('hidden');
        resetBookingForm();
    }
}

function resetBookingForm() {
    // Reset all form fields
    ['bookingName', 'bookingEmail', 'bookingPhone', 'bookingCompany', 'bookingAddress',
        'counterOfferPrice', 'counterOfferNotes', 'deliveryDate', 'deliveryTime',
        'deliveryInstructions'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

    // Reset selections
    selectedFuelOption = null;
    selectedDeliveryOption = null;

    // Reset checkboxes
    const terms = document.getElementById('termsAgreement');
    if (terms) terms.checked = false;

    // Clear selection highlights
    document.querySelectorAll('.fuel-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.delivery-option').forEach(el => el.classList.remove('selected'));
}

function showStep(stepNumber) {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) step.classList.add('hidden');
    }

    // Show current step
    const currentStep = document.getElementById(`step${stepNumber}`);
    if (currentStep) currentStep.classList.remove('hidden');

    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const widths = { 1: '0%', 2: '33%', 3: '66%', 4: '100%' };
        progressBar.style.width = widths[stepNumber] || '0%';
    }

    // Update step indicators
    document.querySelectorAll('.step-number').forEach((el, index) => {
        if (index < stepNumber) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

function nextStep(targetStep) {
    // Validate current step before proceeding
    const currentStep = targetStep - 1;

    if (currentStep === 1) {
        // Validate contact information
        const name = document.getElementById('bookingName').value.trim();
        const email = document.getElementById('bookingEmail').value.trim();
        const phone = document.getElementById('bookingPhone').value.trim();

        if (!name || !email || !phone) {
            alert('Please fill in all required fields (Name, Email, Phone)');
            return;
        }

        if (!email.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }
    }

    if (currentStep === 2) {
        // Validate fuel selection
        if (!selectedFuelOption) {
            alert('Please select a fuel option');
            return;
        }
    }

    if (currentStep === 3) {
        // Validate delivery option
        if (!selectedDeliveryOption) {
            alert('Please select a delivery option');
            return;
        }

        // If delivery selected, validate delivery details
        if (selectedDeliveryOption === 'delivery') {
            const deliveryDate = document.getElementById('deliveryDate').value;
            const deliveryTime = document.getElementById('deliveryTime').value;
            const address = document.getElementById('bookingAddress').value.trim();

            if (!deliveryDate || !deliveryTime || !address) {
                alert('Please fill in all delivery details (Date, Time, Address)');
                return;
            }
        }

        // Generate review summary
        generateOrderReview();
    }

    showStep(targetStep);
}

function prevStep(targetStep) {
    showStep(targetStep);
}

function selectFuelOption(option, element) {
    selectedFuelOption = option;

    // Update UI
    document.querySelectorAll('.fuel-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    // Show/hide fuel terms
    const fuelTerms = document.getElementById('fuelTerms');
    if (fuelTerms) {
        if (option === 'with_fuel') {
            fuelTerms.classList.remove('hidden');
        } else {
            fuelTerms.classList.add('hidden');
        }
    }
}

function selectDeliveryOption(option, element) {
    selectedDeliveryOption = option;

    // Update UI
    document.querySelectorAll('.delivery-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    // Show/hide delivery details
    const deliveryDetails = document.getElementById('deliveryDetails');
    if (deliveryDetails) {
        if (option === 'delivery') {
            deliveryDetails.classList.remove('hidden');
        } else {
            deliveryDetails.classList.add('hidden');
        }
    }
}

function generateOrderReview() {
    if (!currentMachineData) return;

    const name = document.getElementById('bookingName').value;
    const email = document.getElementById('bookingEmail').value;
    const phone = document.getElementById('bookingPhone').value;
    const company = document.getElementById('bookingCompany').value;
    const address = document.getElementById('bookingAddress').value;
    const counterPrice = document.getElementById('counterOfferPrice').value;
    const counterNotes = document.getElementById('counterOfferNotes').value;

    // Calculate final price
    let finalPrice = parseFloat(currentMachineData.price);
    if (counterPrice && parseFloat(counterPrice) > 0) {
        finalPrice = parseFloat(counterPrice);
    }

    // Update order summary
    const orderSummary = document.getElementById('orderSummary');
    if (orderSummary) {
        orderSummary.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-gray-600">Machine:</span>
                    <span class="font-medium">${currentMachineData.name}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Original Price:</span>
                    <span class="font-medium">$${currentMachineData.price}</span>
                </div>
                ${counterPrice ? `
                    <div class="flex justify-between text-orange-600">
                        <span>Counter Offer:</span>
                        <span class="font-medium">$${counterPrice}</span>
                    </div>
                ` : ''}
                <div class="flex justify-between">
                    <span class="text-gray-600">Fuel Option:</span>
                    <span class="font-medium capitalize">${selectedFuelOption.replace('_', ' ')}</span>
                </div>
            </div>
        `;
    }

    // Update customer info
    const customerInfo = document.getElementById('customerInfo');
    if (customerInfo) {
        customerInfo.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-600">Name</p>
                    <p class="font-medium">${name}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Email</p>
                    <p class="font-medium">${email}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Phone</p>
                    <p class="font-medium">${phone}</p>
                </div>
                ${company ? `
                    <div>
                        <p class="text-sm text-gray-600">Company</p>
                        <p class="font-medium">${company}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Update delivery/payment info
    const deliveryInfo = document.getElementById('deliveryPaymentInfo');
    if (deliveryInfo) {
        let deliveryHTML = `
            <div class="space-y-3">
                <div>
                    <p class="text-sm text-gray-600">Delivery Method</p>
                    <p class="font-medium capitalize">${selectedDeliveryOption}</p>
                </div>
        `;

        if (selectedDeliveryOption === 'delivery') {
            const deliveryDate = document.getElementById('deliveryDate').value;
            const deliveryTime = document.getElementById('deliveryTime').value;
            const instructions = document.getElementById('deliveryInstructions').value;

            deliveryHTML += `
                <div>
                    <p class="text-sm text-gray-600">Address</p>
                    <p class="font-medium">${address}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Delivery Date & Time</p>
                    <p class="font-medium">${deliveryDate} - ${deliveryTime}</p>
                </div>
                ${instructions ? `
                    <div>
                        <p class="text-sm text-gray-600">Special Instructions</p>
                        <p class="font-medium">${instructions}</p>
                    </div>
                ` : ''}
            `;
        }

        deliveryHTML += '</div>';
        deliveryInfo.innerHTML = deliveryHTML;
    }

    // Update total
    const orderTotal = document.getElementById('orderTotal');
    if (orderTotal) {
        orderTotal.textContent = `$${finalPrice.toFixed(2)}`;
    }
}

async function submitBooking() {
    try {
        // Validate terms agreement
        const terms = document.getElementById('termsAgreement');
        if (!terms || !terms.checked) {
            alert('Please agree to the terms and conditions');
            return;
        }

        // Show loading
        const submitBtn = document.getElementById('submitButtonText');
        const spinner = document.getElementById('loadingSpinner');
        if (submitBtn) submitBtn.textContent = 'Processing...';
        if (spinner) spinner.classList.remove('hidden');

        // Collect all form data
        const name = document.getElementById('bookingName').value.trim();
        const email = document.getElementById('bookingEmail').value.trim();
        const phone = document.getElementById('bookingPhone').value.trim();
        const company = document.getElementById('bookingCompany').value.trim();
        const address = document.getElementById('bookingAddress').value.trim();
        const counterPrice = document.getElementById('counterOfferPrice').value;
        const counterNotes = document.getElementById('counterOfferNotes').value;
        const deliveryDate = document.getElementById('deliveryDate').value;
        const deliveryTime = document.getElementById('deliveryTime').value;
        const deliveryInstructions = document.getElementById('deliveryInstructions').value;

        // Calculate final price
        let finalPrice = parseFloat(currentMachineData.price);
        if (counterPrice && parseFloat(counterPrice) > 0) {
            finalPrice = parseFloat(counterPrice);
        }

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Prepare order data
        const orderData = {
            order_number: orderNumber,
            machine_id: currentBookingMachineId,
            machine_data: currentMachineData,
            customer_name: name,
            customer_email: email,
            customer_phone: phone,
            customer_company: company || null,
            customer_address: address || null,
            original_price: parseFloat(currentMachineData.price),
            counter_offer_price: counterPrice ? parseFloat(counterPrice) : null,
            counter_offer_notes: counterNotes || null,
            final_price: finalPrice,
            fuel_option: selectedFuelOption,
            delivery_option: selectedDeliveryOption,
            delivery_date: deliveryDate || null,
            delivery_time: deliveryTime || null,
            delivery_instructions: deliveryInstructions || null,
            status: 'pending',
            payment_status: 'unpaid',
            partner_id: currentMachineData.partner_id || null
        };

        // Insert order into Supabase
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select();

        if (error) throw error;

        // Success!
        alert(`✓ Booking Confirmed!\\n\\nOrder Number: ${orderNumber}\\n\\nWe'll contact you at ${email} with next steps.`);

        closeCompleteBookingModal();

    } catch (error) {
        console.error('Booking submission error:', error);
        alert(`Failed to submit booking: ${error.message}\\n\\nPlease try again or contact support.`);
    } finally {
        // Reset loading state
        const submitBtn = document.getElementById('submitButtonText');
        const spinner = document.getElementById('loadingSpinner');
        if (submitBtn) submitBtn.textContent = 'Confirm & Place Order';
        if (spinner) spinner.classList.add('hidden');
    }
}

// ========== MAKE FUNCTIONS GLOBALLY AVAILABLE ==========
window.toggleWishlist = toggleWishlist;
window.openCompleteBookingModal = openCompleteBookingModal;
window.closeCompleteBookingModal = closeCompleteBookingModal;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.selectFuelOption = selectFuelOption;
window.selectDeliveryOption = selectDeliveryOption;
window.submitBooking = submitBooking;
