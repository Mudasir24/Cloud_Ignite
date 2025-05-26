document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("complaintForm");
    const addressChoice = document.getElementById("addressChoice");
    const manualSection = document.getElementById("manualAddressSection");
    const autoSection = document.getElementById("autoLocationSection");
    const getLocationBtn = document.getElementById("getLocationBtn");
    const locationStatus = document.getElementById("locationStatus");
    const complaintImage = document.getElementById("complaintImage");
    const imagePreview = document.getElementById("imagePreview");
    const autoAddress = document.getElementById("autoAddress");

    addressChoice.addEventListener("change", function() {
        const isManual = this.value === "manual";
        manualSection.style.display = isManual ? "block" : "none";
        autoSection.style.display = isManual ? "none" : "block";
    });

    complaintImage.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                imagePreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert("Please select a valid image file (JPEG, PNG)");
            this.value = "";
        }
    });

    document.getElementById("getLocationBtn").addEventListener("click", async function () {
    const locationStatus = document.getElementById("locationStatus");
    const getLocationBtn = this;

    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    const addressInput = document.getElementById("autoAddress");
    const exactAddressInput = document.getElementById("exactAddress");

    // Reset status
    locationStatus.textContent = "Detecting your exact location...";
    locationStatus.style.color = "#2e7d32";

    // Disable button during fetch
    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "🛰️ Locating...";

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            });
        });

        const { latitude, longitude } = position.coords;

        // Optional: Add a check to avoid undefined values
        if (!latitude || !longitude) {
            throw new Error("Coordinates not found");
        }

        // Get address using a reverse geocoding function (assumed to be defined elsewhere)
        const address = await getExactAddress(latitude, longitude); // You must define this separately

        // Update form fields
        addressInput.value = address;
        latitudeInput.value = latitude;
        longitudeInput.value = longitude;
        exactAddressInput.value = address;

        // Success status
        locationStatus.textContent = "Exact address found!";
        locationStatus.style.color = "#2e7d32";

    } catch (error) {
        console.error("Geolocation error:", error);

        let message = "Error getting location.";
        if (error.code === 1) message = "Permission denied - please allow location access";
        else if (error.code === 2) message = "Position unavailable (try outdoors)";
        else if (error.code === 3) message = "Timeout - try again";
        else message = error.message || "Unexpected error occurred";

        locationStatus.textContent = message;
        locationStatus.style.color = "#e53935";
    } finally {
        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "📍 Get Exact Location";
    }
});


    async function getExactAddress(lat, lon) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            const data = await response.json();
            
            if (data.address) {
                const addr = data.address;
                return [
                    addr.house_number && addr.road ? `${addr.house_number} ${addr.road}` : addr.road,
                    addr.neighbourhood || addr.suburb,
                    addr.city || addr.town || addr.village,
                    addr.postcode,
                    addr.country
                ].filter(Boolean).join(", ");
            }
            return data.display_name || `Near ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        } catch (error) {
            console.error("Geocoding error:", error);
            return `Near ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        }
    }
});