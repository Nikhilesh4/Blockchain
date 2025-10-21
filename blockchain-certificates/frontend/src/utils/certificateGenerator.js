import html2canvas from 'html2canvas';

/**
 * Generate a certificate image in the browser using HTML5 Canvas
 * @param {Object} details - { name, grade, recipientAddress, issuedDate, issuer }
 * @returns {Promise<Blob>} - Certificate image as a Blob
 */
export async function generateCertificateImage(details) {
    const { name, grade, recipientAddress, issuedDate, issuer = 'Blockchain University' } = details;
    
    // Create a temporary container for the certificate
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1920px';
    container.style.height = '1080px';
    document.body.appendChild(container);

    // Create certificate HTML structure
    container.innerHTML = `
        <div style="
            width: 1920px;
            height: 1080px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            position: relative;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
        ">
            <!-- Outer Border -->
            <div style="
                position: absolute;
                top: 40px;
                left: 40px;
                right: 40px;
                bottom: 40px;
                border: 20px solid #ffd700;
                box-sizing: border-box;
            ">
                <!-- Inner Border -->
                <div style="
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    bottom: 20px;
                    border: 5px solid #ffffff;
                    box-sizing: border-box;
                ">
                    <!-- Content Container -->
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        padding: 60px;
                        text-align: center;
                    ">
                        <!-- Title -->
                        <div style="
                            font-size: 80px;
                            font-weight: bold;
                            color: #ffd700;
                            margin-bottom: 40px;
                            letter-spacing: 4px;
                        ">
                            CERTIFICATE OF ACHIEVEMENT
                        </div>

                        <!-- Subtitle -->
                        <div style="
                            font-size: 40px;
                            font-style: italic;
                            color: #ffffff;
                            margin-bottom: 50px;
                        ">
                            This is to certify that
                        </div>

                        <!-- Recipient Name -->
                        <div style="
                            font-size: 90px;
                            font-weight: bold;
                            color: #ffd700;
                            margin-bottom: 50px;
                            text-transform: capitalize;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                        ">
                            ${name}
                        </div>

                        <!-- Achievement Text -->
                        <div style="
                            font-size: 35px;
                            color: #ffffff;
                            margin-bottom: 20px;
                            line-height: 1.5;
                        ">
                            has successfully completed the Blockchain Development Course<br>
                            with an outstanding grade of
                        </div>

                        <!-- Grade -->
                        <div style="
                            font-size: 70px;
                            font-weight: bold;
                            color: #00ff00;
                            margin-bottom: 40px;
                            background: rgba(0,255,0,0.1);
                            padding: 20px 60px;
                            border-radius: 20px;
                            border: 3px solid #00ff00;
                        ">
                            ${grade}
                        </div>

                        <!-- Date -->
                        <div style="
                            font-size: 30px;
                            color: #ffffff;
                            margin-bottom: 20px;
                        ">
                            Issued on: ${issuedDate}
                        </div>

                        <!-- Wallet Address -->
                        <div style="
                            font-size: 25px;
                            font-family: monospace;
                            color: #cccccc;
                            margin-bottom: 20px;
                        ">
                            Wallet: ${recipientAddress.slice(0, 10)}...${recipientAddress.slice(-8)}
                        </div>

                        <!-- Blockchain Verification -->
                        <div style="
                            font-size: 22px;
                            font-style: italic;
                            color: #aaaaaa;
                            margin-top: 20px;
                        ">
                            Verified on Blockchain - Immutable & Permanent
                        </div>

                        <!-- Decorative Seals -->
                        <div style="
                            position: absolute;
                            bottom: 80px;
                            left: 0;
                            right: 0;
                            display: flex;
                            justify-content: space-between;
                            padding: 0 220px;
                        ">
                            <!-- Left Seal -->
                            <svg width="160" height="160" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="75" fill="#ffd700" stroke="#ffffff" stroke-width="3"/>
                                <circle cx="80" cy="80" r="52" fill="none" stroke="#1e3c72" stroke-width="2"/>
                                <polygon points="80,30 95,65 130,65 102,87 115,122 80,100 45,122 58,87 30,65 65,65" fill="#1e3c72"/>
                            </svg>

                            <!-- Right Seal -->
                            <svg width="160" height="160" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="75" fill="#ffd700" stroke="#ffffff" stroke-width="3"/>
                                <circle cx="80" cy="80" r="52" fill="none" stroke="#1e3c72" stroke-width="2"/>
                                <polygon points="80,30 95,65 130,65 102,87 115,122 80,100 45,122 58,87 30,65 65,65" fill="#1e3c72"/>
                            </svg>
                        </div>

                        <!-- Issuer -->
                        <div style="
                            position: absolute;
                            bottom: 40px;
                            left: 0;
                            right: 0;
                            font-size: 28px;
                            color: #ffd700;
                            font-weight: bold;
                        ">
                            ${issuer}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Wait for any fonts or styles to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert to canvas
    const canvas = await html2canvas(container, {
        width: 1920,
        height: 1080,
        scale: 1,
        backgroundColor: null,
        logging: false,
        useCORS: true
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Convert canvas to Blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to generate certificate image'));
            }
        }, 'image/png', 1.0);
    });
}

/**
 * Convert Blob to data URL for preview
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
export function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Download certificate image
 * @param {Blob} blob 
 * @param {string} filename 
 */
export function downloadCertificate(blob, filename = 'certificate.png') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
