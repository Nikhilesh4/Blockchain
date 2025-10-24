// import html2canvas from 'html2canvas';

// /**
//  * Generate a certificate image in the browser using HTML5 Canvas
//  * @param {Object} details - { name, grade, recipientAddress, issuedDate, issuer, issuerAddress, tokenId }
//  * @returns {Promise<Blob>} - Certificate image as a Blob
//  */
// export async function generateCertificateImage(details) {
//     const { 
//         name, 
//         grade, 
//         recipientAddress, 
//         issuedDate, 
//         issuer = 'Blockchain University',
//         issuerAddress = null,
//         tokenId = null
//     } = details;
    
//     // Create a temporary container for the certificate
//     const container = document.createElement('div');
//     container.style.position = 'fixed';
//     container.style.left = '-9999px';
//     container.style.top = '-9999px';
//     container.style.width = '1920px';
//     container.style.height = '1080px';
//     document.body.appendChild(container);

//     // Create certificate HTML structure with improved vertical spacing (stable layout)
//     // Key change: main content area uses flex column with space-between so top, middle, and footer
//     // are evenly spaced and will not create an unexpected gap.
//     container.innerHTML = `
//         <div style="
//             width: 1920px;
//             height: 1080px;
//             background: linear-gradient(135deg, #2a3d35 0%, #527162 50%, #394e44 100%);
//             position: relative;
//             font-family: 'Georgia', 'Times New Roman', serif;
//             box-sizing: border-box;
//             overflow: hidden;
//         ">
//             <!-- Decorative Background Pattern -->
//             <div style="
//                 position: absolute;
//                 top: 0;
//                 left: 0;
//                 right: 0;
//                 bottom: 0;
//                 background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 35px, rgba(0,0,0,0.02) 35px, rgba(0,0,0,0.02) 70px);
//                 pointer-events: none;
//             "></div>

//             <!-- ============= WATERMARK WITH TOKEN ID (TOP RIGHT) ============= -->
//             ${tokenId ? `
//             <div style="
//                 position: absolute;
//                 top: 110px;
//                 right: 140px;
//                 z-index: 15;
//                 background: rgba(212,175,55,0.10);
//                 padding: 14px 22px;
//                 border-radius: 12px;
//                 border: 2px solid rgba(212,175,55,0.35);
//                 backdrop-filter: blur(4px);
//                 box-shadow: 0 4px 12px rgba(0,0,0,0.25);
//             ">
//                 <div style="
//                     font-size: 13px;
//                     color: #d4af37;
//                     font-weight: 600;
//                     margin-bottom: 6px;
//                     text-align: center;
//                     letter-spacing: 1px;
//                     text-transform: uppercase;
//                     font-family: Arial, sans-serif;
//                 ">
//                     Token ID
//                 </div>
//                 <div style="
//                     font-size: 30px;
//                     color: #ffffff;
//                     font-weight: 700;
//                     font-family: 'Courier New', monospace;
//                     text-align: center;
//                     text-shadow: 1px 1px 6px rgba(0,0,0,0.45);
//                     letter-spacing: 1px;
//                 ">
//                     #${tokenId}
//                 </div>
//             </div>
//             ` : ''}

//             <!-- Outer Border -->
//             <div style="
//                 position: absolute;
//                 top: 40px;
//                 left: 40px;
//                 right: 40px;
//                 bottom: 40px;
//                 border: 18px solid #d4af37;
//                 box-sizing: border-box;
//                 pointer-events: none;
//                 box-shadow: inset 0 0 30px rgba(212,175,55,0.25);
//             "></div>
            
//             <!-- Inner Border -->
//             <div style="
//                 position: absolute;
//                 top: 65px;
//                 left: 65px;
//                 right: 65px;
//                 bottom: 65px;
//                 border: 4px solid #e8d4a0;
//                 box-sizing: border-box;
//                 pointer-events: none;
//             "></div>

//             <!-- Accent Lines -->
//             <div style="
//                 position: absolute;
//                 top: 72px;
//                 left: 72px;
//                 right: 72px;
//                 bottom: 72px;
//                 border: 1px solid rgba(212,175,55,0.28);
//                 box-sizing: border-box;
//                 pointer-events: none;
//             "></div>

//             <!-- Content Container: use space-between to distribute top title, middle content and footer evenly -->
//             <div style="
//                 position: absolute;
//                 top: 110px;
//                 left: 120px;
//                 right: 120px;
//                 bottom: 110px;
//                 display: flex;
//                 flex-direction: column;
//                 align-items: center;
//                 justify-content: space-between; /* evenly distribute */
//                 padding: 20px 40px;
//                 text-align: center;
//                 z-index: 10;
//             ">

//                 <!-- Top group: Title + subtitle -->
//                 <div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;">
//                     <div style="
//                         font-size: 64px;
//                         font-weight: bold;
//                         color: #d4af37;
//                         letter-spacing: 8px;
//                         text-transform: uppercase;
//                         text-shadow: 2px 2px 8px rgba(0,0,0,0.45);
//                         font-family: 'Georgia', serif;
//                     ">
//                         CERTIFICATE OF ACHIEVEMENT
//                     </div>

//                     <div style="
//                         width: 360px;
//                         height: 2px;
//                         background: linear-gradient(to right, transparent, #d4af37, transparent);
//                     "></div>

//                     <div style="
//                         font-size: 30px;
//                         font-style: italic;
//                         color: #e8d4a0;
//                         font-weight: 300;
//                     ">
//                         This is to certify that
//                     </div>
//                 </div>

//                 <!-- Middle group: Name, achievement text, grade, date, addresses -->
//                 <div style="display:flex;flex-direction:column;align-items:center;gap:14px;max-width:1600px; width:100%; padding: 0 60px; box-sizing:border-box;">
//                     <div style="
//                         font-size: 70px;
//                         font-weight: bold;
//                         color: #ffffff;
//                         text-transform: capitalize;
//                         text-shadow: 3px 3px 10px rgba(0,0,0,0.55);
//                         word-wrap: break-word;
//                         max-width: 1500px;
//                         font-family: 'Georgia', serif;
//                         letter-spacing: 1px;
//                         line-height: 1.05;
//                     ">
//                         ${name}
//                     </div>

//                     <div style="
//                         font-size: 26px;
//                         color: #e0e0e0;
//                         line-height: 1.5;
//                         font-weight: 300;
//                     ">
//                         has successfully completed the Blockchain Development Course<br/>
//                         with an outstanding grade of
//                     </div>

//                     <div style="
//                         font-size: 52px;
//                         font-weight: 700;
//                         color: #4ade80;
//                         background: linear-gradient(135deg, rgba(74,222,128,0.10), rgba(34,197,94,0.10));
//                         padding: 10px 50px;
//                         border-radius: 14px;
//                         border: 3px solid rgba(74,222,128,0.35);
//                         box-shadow: 0 0 20px rgba(74,222,128,0.18);
//                         font-family: 'Arial', sans-serif;
//                     ">
//                         ${grade}
//                     </div>

//                     <div style="
//                         font-size: 22px;
//                         color: #d0d0d0;
//                         font-weight: 300;
//                     ">
//                         Issued on: ${issuedDate}
//                     </div>

//                     <!-- Addresses -->
//                     <div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;margin-top:6px;">
//                         <div style="
//                             font-size: 16px;
//                             color: #b0b0b0;
//                             font-weight: 500;
//                         ">
//                             Recipient Address:
//                         </div>
//                         <div style="
//                             font-size: 15px;
//                             font-family: 'Courier New', monospace;
//                             color: #4ade80;
//                             background: rgba(74,222,128,0.07);
//                             padding: 6px 18px;
//                             border-radius: 6px;
//                             border: 1px solid rgba(74,222,128,0.22);
//                             word-break: break-all;
//                             max-width: 1400px;
//                         ">
//                             ${recipientAddress}
//                         </div>

//                         ${issuerAddress ? `
//                         <div style="
//                             margin-top:8px;
//                             display:flex;
//                             flex-direction:column;
//                             align-items:center;
//                             gap:6px;
//                         ">
//                             <div style="
//                                 font-size: 16px;
//                                 color: #b0b0b0;
//                                 font-weight: 500;
//                             ">
//                                 Issued By:
//                             </div>
//                             <div style="
//                                 font-size: 15px;
//                                 font-family: 'Courier New', monospace;
//                                 color: #d4af37;
//                                 background: rgba(212,175,55,0.06);
//                                 padding: 6px 18px;
//                                 border-radius: 6px;
//                                 border: 1px solid rgba(212,175,55,0.18);
//                                 word-break: break-all;
//                                 max-width: 1400px;
//                             ">
//                                 ${issuerAddress}
//                             </div>
//                         </div>
//                         ` : ''}

//                         <div style="
//                             font-size: 15px;
//                             font-style: italic;
//                             color: #999999;
//                             margin-top: 6px;
//                             font-weight: 300;
//                         ">
//                             Verified on Blockchain - Immutable & Permanent
//                         </div>
//                     </div>
//                 </div>

//                 <!-- Footer group: Issuer name (evenly spaced from the rest) -->
//                 <div style="
//                     display:flex;
//                     flex-direction:column;
//                     align-items:center;
//                     gap:6px;
//                 ">
//                     <div style="
//                         font-size: 30px;
//                         color: #d4af37;
//                         font-weight: bold;
//                         font-family: 'Georgia', serif;
//                         letter-spacing: 2px;
//                         text-shadow: 2px 2px 6px rgba(0,0,0,0.4);
//                     ">
//                         ${issuer}
//                     </div>
//                     <div style="
//                         font-size: 12px;
//                         color: rgba(255,255,255,0.18);
//                     ">
//                         <!-- small decorative spacer or tagline -->
//                     </div>
//                 </div>
//             </div>

//             <!-- Decorative Seals (anchored to the very bottom inside the outer border) -->
//             <div style="
//                 position: absolute;
//                 bottom: 48px;
//                 left: 160px;
//                 z-index: 5;
//             ">
//                 <svg width="110" height="110" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
//                     <defs>
//                         <radialGradient id="goldGrad1" cx="50%" cy="50%" r="50%">
//                             <stop offset="0%" style="stop-color:#f4e5b8;stop-opacity:1" />
//                             <stop offset="100%" style="stop-color:#d4af37;stop-opacity:1" />
//                         </radialGradient>
//                     </defs>
//                     <circle cx="80" cy="80" r="75" fill="url(#goldGrad1)" stroke="#0f2847" stroke-width="4"/>
//                     <circle cx="80" cy="80" r="52" fill="none" stroke="#0f2847" stroke-width="2"/>
//                     <polygon points="80,30 95,65 130,65 102,87 115,122 80,100 45,122 58,87 30,65 65,65" fill="#0f2847"/>
//                 </svg>
//             </div>

//             <div style="
//                 position: absolute;
//                 bottom: 48px;
//                 right: 160px;
//                 z-index: 5;
//             ">
//                 <svg width="110" height="110" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
//                     <defs>
//                         <radialGradient id="goldGrad2" cx="50%" cy="50%" r="50%">
//                             <stop offset="0%" style="stop-color:#f4e5b8;stop-opacity:1" />
//                             <stop offset="100%" style="stop-color:#d4af37;stop-opacity:1" />
//                         </radialGradient>
//                     </defs>
//                     <circle cx="80" cy="80" r="75" fill="url(#goldGrad2)" stroke="#0f2847" stroke-width="4"/>
//                     <circle cx="80" cy="80" r="52" fill="none" stroke="#0f2847" stroke-width="2"/>
//                     <polygon points="80,30 95,65 130,65 102,87 115,122 80,100 45,122 58,87 30,65 65,65" fill="#0f2847"/>
//                 </svg>
//             </div>
//         </div>
//     `;

//     // Wait for any fonts or styles to load
//     await new Promise(resolve => setTimeout(resolve, 120));

//     // Convert to canvas
//     try {
//         const canvas = await html2canvas(container, {
//             width: 1920,
//             height: 1080,
//             scale: 1,
//             backgroundColor: null,
//             logging: false,
//             useCORS: true
//         });
//     } catch (error) {
//         console.error('Certificate generation failed:', error);
//         throw new Error('Failed to generate certificate image. Please try again.');
//     } finally {
//         if (document.body.contains(container)) {
//             document.body.removeChild(container);
//         }
//     }

//     // Remove temporary container
//     document.body.removeChild(container);

//     // Convert canvas to Blob
//     return new Promise((resolve, reject) => {
//         canvas.toBlob((blob) => {
//             if (blob) {
//                 resolve(blob);
//             } else {
//                 reject(new Error('Failed to generate certificate image'));
//             }
//         }, 'image/png', 1.0);
//     });
// }

// /**
//  * Convert Blob to data URL for preview
//  * @param {Blob} blob 
//  * @returns {Promise<string>}
//  */
// export function blobToDataURL(blob) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result);
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//     });
// }

// /**
//  * Download certificate image
//  * @param {Blob} blob 
//  * @param {string} filename 
//  */
// export function downloadCertificate(blob, filename = 'certificate.png') {
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
// }

import html2canvas from 'html2canvas';

/**
 * Generate a certificate image in the browser using HTML5 Canvas
 * @param {Object} details - { name, grade, recipientAddress, issuedDate, issuer, issuerAddress, tokenId }
 * @returns {Promise<Blob>} - Certificate image as a Blob
 */
export async function generateCertificateImage(details) {
    const { 
        name, 
        grade, 
        recipientAddress, 
        issuedDate, 
        issuer = 'Blockchain University',
        issuerAddress = null,
        tokenId = null
    } = details;
    
    // Create a temporary container for the certificate
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1920px';
    container.style.height = '1080px';
    container.style.zIndex = '-1';
    
    try {
        document.body.appendChild(container);

        // Create certificate HTML structure with enhanced professional design
        container.innerHTML = `
            <div style="
                width: 1920px;
                height: 1080px;
                background: linear-gradient(135deg, #0f2847 0%, #1a4d7a 50%, #0f2847 100%);
                position: relative;
                font-family: 'Georgia', 'Times New Roman', serif;
                box-sizing: border-box;
                overflow: hidden;
            ">
                <!-- Decorative Background Pattern -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: 
                        repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.02) 35px, rgba(255,255,255,.02) 70px);
                    pointer-events: none;
                "></div>


                <!-- Outer Border -->
                <div style="
                    position: absolute;
                    top: 40px;
                    left: 40px;
                    right: 40px;
                    bottom: 40px;
                    border: 18px solid #d4af37;
                    box-sizing: border-box;
                    pointer-events: none;
                    box-shadow: inset 0 0 30px rgba(212,175,55,0.3);
                "></div>
                
                <!-- Inner Border -->
                <div style="
                    position: absolute;
                    top: 65px;
                    left: 65px;
                    right: 65px;
                    bottom: 65px;
                    border: 4px solid #e8d4a0;
                    box-sizing: border-box;
                    pointer-events: none;
                "></div>

                <!-- Accent Lines -->
                <div style="
                    position: absolute;
                    top: 72px;
                    left: 72px;
                    right: 72px;
                    bottom: 72px;
                    border: 1px solid rgba(212,175,55,0.4);
                    box-sizing: border-box;
                    pointer-events: none;
                "></div>

                <!-- Content Container -->
                <div style="
                    position: absolute;
                    top: 90px;
                    left: 100px;
                    right: 100px;
                    bottom: 90px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 15px 40px 0 40px;
                    text-align: center;
                    z-index: 10;
                ">
                    <!-- Title -->
                    <div style="
                        font-size: 68px;
                        font-weight: bold;
                        color: #d4af37;
                        margin-bottom: 18px;
                        letter-spacing: 8px;
                        text-transform: uppercase;
                        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
                        font-family: 'Georgia', serif;
                    ">
                        CERTIFICATE OF ACHIEVEMENT
                    </div>

                    <!-- Decorative Line -->
                    <div style="
                        width: 300px;
                        height: 2px;
                        background: linear-gradient(to right, transparent, #d4af37, transparent);
                        margin-bottom: 20px;
                    "></div>

                    <!-- Subtitle -->
                    <div style="
                        font-size: 32px;
                        font-style: italic;
                        color: #e8d4a0;
                        margin-bottom: 22px;
                        font-weight: 300;
                    ">
                        This is to certify that
                    </div>

                    <!-- Recipient Name -->
                    <div style="
                        font-size: 76px;
                        font-weight: bold;
                        color: #ffffff;
                        margin-bottom: 22px;
                        text-transform: capitalize;
                        text-shadow: 3px 3px 10px rgba(212,175,55,0.4);
                        word-wrap: break-word;
                        max-width: 1500px;
                        font-family: 'Georgia', serif;
                        letter-spacing: 2px;
                    ">
                        ${name}
                    </div>

                    <!-- Achievement Text -->
                    <div style="
                        font-size: 28px;
                        color: #e0e0e0;
                        margin-bottom: 10px;
                        line-height: 1.5;
                        font-weight: 300;
                    ">
                        has successfully completed the Blockchain Development Course<br>
                        with an outstanding grade of
                    </div>

                    <!-- Grade -->
                    <div style="
                        font-size: 56px;
                        font-weight: bold;
                        color: #4ade80;
                        margin-bottom: 18px;
                        background: linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.15));
                        padding: 12px 45px;
                        border-radius: 15px;
                        border: 3px solid #4ade80;
                        box-shadow: 0 0 20px rgba(74,222,128,0.3);
                        font-family: 'Arial', sans-serif;
                    ">
                        ${grade}
                    </div>

                    <!-- Date -->
                    <div style="
                        font-size: 24px;
                        color: #d0d0d0;
                        margin-bottom: 12px;
                        font-weight: 300;
                    ">
                        Issued on: ${issuedDate}
                    </div>

                    <!-- Recipient Wallet Address -->
                    <div style="
                        font-size: 16px;
                        color: #b0b0b0;
                        margin-bottom: 4px;
                        font-weight: 500;
                    ">
                        Recipient Address:
                    </div>
                    <div style="
                        font-size: 15px;
                        font-family: 'Courier New', monospace;
                        color: #4ade80;
                        margin-bottom: 12px;
                        background: rgba(74,222,128,0.08);
                        padding: 5px 16px;
                        border-radius: 6px;
                        border: 1px solid rgba(74,222,128,0.3);
                        word-break: break-all;
                        max-width: 1400px;
                    ">
                        ${recipientAddress}
                    </div>

                    <!-- Issuer Wallet Address (if available) -->
                    ${issuerAddress ? `
                    <div style="
                        font-size: 16px;
                        color: #b0b0b0;
                        margin-bottom: 4px;
                        font-weight: 500;
                    ">
                        Issued By:
                    </div>
                    <div style="
                        font-size: 15px;
                        font-family: 'Courier New', monospace;
                        color: #d4af37;
                        margin-bottom: 12px;
                        background: rgba(212,175,55,0.08);
                        padding: 5px 16px;
                        border-radius: 6px;
                        border: 1px solid rgba(212,175,55,0.3);
                        word-break: break-all;
                        max-width: 1400px;
                    ">
                        ${issuerAddress}
                    </div>
                    ` : ''}

                    <!-- Blockchain Verification -->
                    <div style="
                        font-size: 16px;
                        font-style: italic;
                        color: #888888;
                        margin-top: 8px;
                        font-weight: 300;
                    ">
                        Verified on Blockchain - Immutable & Permanent
                    </div>
                </div>

                <!-- Decorative Seals and Issuer Name Container -->
                <div style="
                    position: absolute;
                    bottom: 60px;
                    left: 0;
                    right: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 160px;
                    z-index: 10;
                ">
                    <!-- Left Seal -->
                    <div style="flex-shrink: 0;">
                        <svg width="110" height="110" viewBox="0 0 160 160">
                            <defs>
                                <radialGradient id="goldGrad1" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" style="stop-color:#f4e5b8;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#d4af37;stop-opacity:1" />
                                </radialGradient>
                            </defs>
                            <circle cx="80" cy="80" r="75" fill="url(#goldGrad1)" stroke="#0f2847" stroke-width="4"/>
                            <circle cx="80" cy="80" r="52" fill="none" stroke="#0f2847" stroke-width="2"/>
                            <polygon points="80,30 95,65 130,65 102,87 115,122 80,100 45,122 58,87 30,65 65,65" fill="#0f2847"/>
                        </svg>
                    </div>

                    <!-- Issuer Name (Center) -->
                    <div style="
                        flex: 1;
                        text-align: center;
                        padding: 0 30px;
                    ">
                        <div style="
                            font-size: 32px;
                            color: #d4af37;
                            font-weight: bold;
                            font-family: 'Georgia', serif;
                            letter-spacing: 2px;
                            text-shadow: 2px 2px 6px rgba(0,0,0,0.4);
                        ">
                            ${issuer}
                        </div>
                    </div>

                    <!-- Right Seal -->
                    <div style="flex-shrink: 0;">
                        <svg width="110" height="110" viewBox="0 0 160 160">
                            <defs>
                                <radialGradient id="goldGrad2" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" style="stop-color:#f4e5b8;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#d4af37;stop-opacity:1" />
                                </radialGradient>
                            </defs>
                            <circle cx="80" cy="80" r="75" fill="url(#goldGrad2)" stroke="#0f2847" stroke-width="4"/>
                            <circle cx="80" cy="80" r="52" fill="none" stroke="#0f2847" stroke-width="2"/>
                            <polygon points="80,30 95,65 130,65 102,87 115,122 80,100 45,122 58,87 30,65 65,65" fill="#0f2847"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;

        // Wait for any fonts or styles to load
        await new Promise(resolve => setTimeout(resolve, 150));

        // Convert to canvas
        const canvas = await html2canvas(container, {
            width: 1920,
            height: 1080,
            scale: 1,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        // Convert canvas to Blob
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to generate certificate image'));
                }
            }, 'image/png', 1.0);
        });

        return blob;

    } catch (error) {
        console.error('Error in generateCertificateImage:', error);
        throw error;
    } finally {
        // Safe removal of container
        try {
            if (container && container.parentNode === document.body) {
                document.body.removeChild(container);
            }
        } catch (removeError) {
            console.warn('Could not remove container:', removeError);
        }
    }
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