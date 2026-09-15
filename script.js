document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DOM ELEMENTS (ĐỐI TƯỢNG XÀI CHUNG)
    // ==========================================
    const elements = {
        passwordInput: document.getElementById('password'),
        btnCopy: document.getElementById('btn-copy'),
        lengthSlider: document.getElementById('length-slider'),
        lengthValue: document.getElementById('length-value'),
        
        boxUppercase: document.getElementById('box1'),
        boxLowercase: document.getElementById('box2'),
        boxNumbers: document.getElementById('box3'),
        boxSymbols: document.getElementById('box4'),
        
        btnGenerate: document.querySelector('.btn-primary'),
        themeSelect: document.getElementById('lua-chon'),
        
        progressFill: document.querySelector('.progress-fill'),
        strengthPercent: document.querySelector('.strength-percent'),
        statusTag: document.querySelector('.status-tag'),
        strengthText: document.querySelector('.strength-status p')
    };

    // ==========================================
    // 2. CONSTANTS & CONFIGURATIONS
    // ==========================================
    const CHAR_SETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    // ==========================================
    // 3. UTILITY FUNCTIONS (HÀM BỔ TRỢ)
    // ==========================================

    /**
     * Sinh số nguyên ngẫu nhiên an toàn trong khoảng [0, max - 1] bằng Web Crypto API
     */
    function getRandomCryptoInt(max) {
        // Tạo mảng chứa 1 số nguyên không dấu 32-bit
        const array = new Uint32Array(1);

        // Điền số ngẫu nhiên chuẩn bảo mật cryptographic vào mảng
        window.crypto.getRandomValues(array);

        // Chia lấy dư cho max để ép giá trị về khoảng [0, max - 1]
        return array[0] % max;
    }

    /**
     * Xáo trộn vị trí các phần tử mảng (Thuật toán Fisher-Yates) và trả về chuỗi
     */
    function shuffleArray(array) {
        // Lặp ngược từ phần tử cuối cùng về phần tử thứ 2
        for (let i = array.length - 1; i > 0; i--) {
            // Lấy chỉ số ngẫu nhiên j trong khoảng [0, i]
            const j = getRandomCryptoInt(i + 1);

            // Đổi chỗ 2 phần tử vị trí i và j (Cú pháp Destructuring ES6)
            [array[i], array[j]] = [array[j], array[i]];
        }

        // Nối các phần tử mảng thành một chuỗi hoàn chỉnh
        return array.join('');
    }

    // ==========================================
    // 4. THEME MANAGEMENT MODULE
    // ==========================================
    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }

    // ==========================================
    // 4. THEME MANAGEMENT MODULE
    // ==========================================

    /**
     * Xử lý sự kiện khi người dùng chọn Theme mới từ thẻ <select>
     */
    function handleThemeChange(e) {
        // Lấy giá trị Theme người dùng vừa chọn ('dark' hoặc 'light') từ sự kiện
        const selectedTheme = e.target.value;

        // Gọi hàm áp dụng giao diện tương ứng lên document.body
        applyTheme(selectedTheme);

        // Lưu lại lựa chọn vào localStorage để duy trì trạng thái khi F5 hoặc quay lại trang
        localStorage.setItem('theme', selectedTheme);
    }

    /**
     * Khởi tạo Theme ban đầu khi trang web vừa tải xong
     */
    function initTheme() {
        // Đọc Theme đã lưu trong localStorage, nếu chưa có thì lấy mặc định là 'dark'
        const savedTheme = localStorage.getItem('theme') || 'dark';

        // Cập nhật giá trị hiển thị trên thẻ <select> cho khớp với Theme đã chọn
        elements.themeSelect.value = savedTheme;

        // Áp dụng giao diện đã lưu lên trang web
        applyTheme(savedTheme);
    }

    // ==========================================
    // 5. PASSWORD STRENGTH MODULE
    // ==========================================
    function updateStrengthMeter(score) {
        const { progressFill, strengthPercent, statusTag, strengthText } = elements;

        progressFill.style.width = `${score}%`;
        strengthPercent.textContent = `${score}%`;
        statusTag.className = 'status-tag';

        if (score === 0) {
            statusTag.textContent = 'None';
            statusTag.style.background = 'rgba(148, 163, 184, 0.2)';
            statusTag.style.color = '#94a3b8';
            progressFill.style.background = '#94a3b8';
            strengthText.textContent = 'Please choose options to generate.';
        } else if (score < 40) {
            statusTag.textContent = 'Weak';
            statusTag.style.background = 'rgba(239, 68, 68, 0.2)';
            statusTag.style.color = '#ef4444';
            progressFill.style.background = '#ef4444';
            strengthText.textContent = 'Too weak! Increase length or add more character types.';
        } else if (score < 75) {
            statusTag.textContent = 'Medium';
            statusTag.style.background = 'rgba(245, 158, 11, 0.2)';
            statusTag.style.color = '#f59e0b';
            progressFill.style.background = '#f59e0b';
            strengthText.textContent = 'Decent password, but could be stronger.';
        } else {
            statusTag.textContent = 'Strong';
            statusTag.style.background = 'rgba(34, 197, 94, 0.2)';
            statusTag.style.color = '#22c55e';
            progressFill.style.background = '#22c55e';
            strengthText.textContent = 'Your password is very secure and hard to guess!';
        }
    }

        /**
     * Đánh giá độ mạnh mật khẩu dựa trên Entropy và cập nhật giao diện
     * @param {string} password - Chuỗi mật khẩu
     * @param {number} poolSize - Số lượng ký tự trong tập hợp lựa chọn
     */
    function evaluateStrength(password, poolSize) {
        // 1. Nếu mật khẩu rỗng, đặt độ mạnh về 0 và thoát hàm
        if (!password) {
            updateStrengthMeter(0);
            return;
        }

        // 2. Tính chỉ số Entropy (tính bằng bit): L * log2(R)
        const entropy = password.length * Math.log2(poolSize);

        // 3. Quy đổi Entropy sang thang điểm [0 - 100] (coi 120 bits là 100% an toàn)
        let score = Math.min(Math.floor((entropy / 120) * 100), 100);

        // 4. Nếu độ dài < 10 ký tự, giới hạn điểm tối đa là 40% để tránh mật khẩu ngắn
        if (password.length < 10) score = Math.min(score, 40);

        // 5. Cập nhật thanh hiển thị độ mạnh lên giao diện
        updateStrengthMeter(score);
    }

    /**
    * Lấy tập hợp ký tự hợp lệ (pool) và các ký tự bắt buộc phải có (mandatoryChars)
    * dựa trên các checkbox mà người dùng đã tích chọn.
    * @returns {{ pool: string, mandatoryChars: Array<string> }}
    */
    function getSelectedPoolAndMandatoryChars() {
        let pool = '';                  // Chuỗi chứa toàn bộ ký tự có thể dùng
        const mandatoryChars = [];      // Mảng chứa các ký tự bắt buộc xuất hiện

    // 1. Nếu tích chọn chữ IN HOA
    if (elements.boxUppercase.checked) {
        pool += CHAR_SETS.uppercase; // Thêm chuỗi chữ in hoa vào pool
        // Chọn ngẫu nhiên 1 chữ in hoa và thêm vào danh sách bắt buộc
        mandatoryChars.push(CHAR_SETS.uppercase[getRandomCryptoInt(CHAR_SETS.uppercase.length)]);
    }

    // 2. Nếu tích chọn chữ IN THƯỜNG
    if (elements.boxLowercase.checked) {
        pool += CHAR_SETS.lowercase; // Thêm chuỗi chữ in thường vào pool
        // Chọn ngẫu nhiên 1 chữ in thường và thêm vào danh sách bắt buộc
        mandatoryChars.push(CHAR_SETS.lowercase[getRandomCryptoInt(CHAR_SETS.lowercase.length)]);
    }

    // 3. Nếu tích chọn CHỮ SỐ
    if (elements.boxNumbers.checked) {
        pool += CHAR_SETS.numbers;   // Thêm chuỗi chữ số vào pool
        // Chọn ngẫu nhiên 1 chữ số và thêm vào danh sách bắt buộc
        mandatoryChars.push(CHAR_SETS.numbers[getRandomCryptoInt(CHAR_SETS.numbers.length)]);
    }

    // 4. Nếu tích chọn KÝ TỰ ĐẶC BIỆT
    if (elements.boxSymbols.checked) {
        pool += CHAR_SETS.symbols;   // Thêm chuỗi ký tự đặc biệt vào pool
        // Chọn ngẫu nhiên 1 ký tự đặc biệt và thêm vào danh sách bắt buộc
        mandatoryChars.push(CHAR_SETS.symbols[getRandomCryptoInt(CHAR_SETS.symbols.length)]);
    }

    // Trả về một object gồm pool và mảng mandatoryChars
    return { pool, mandatoryChars };
    }

        /**
     * Xử lý logic sinh mật khẩu ngẫu nhiên hoàn chỉnh và hiển thị lên giao diện
     */
    function handlePasswordGeneration() {
        // 1. Lấy độ dài mật khẩu từ thanh trượt slider (chuyển sang kiểu số nguyên)
        const length = parseInt(elements.lengthSlider.value, 10);

        // 2. Lấy tập hợp ký tự (pool) và các ký tự bắt buộc (mandatoryChars)
        const { pool, mandatoryChars } = getSelectedPoolAndMandatoryChars();

        // 3. Nếu người dùng không chọn ô nào (pool rỗng), hiển thị cảnh báo và dừng
        if (pool === '') {
            elements.passwordInput.value = '';
            elements.passwordInput.placeholder = 'Select at least 1 option!';
            updateStrengthMeter(0);
            return;
        }

        // 4. Tính số lượng ký tự còn thiếu cần phải sinh thêm
        const remainingLength = length - mandatoryChars.length;

        // 5. Khởi tạo mảng kết quả với các ký tự bắt buộc có sẵn
        const resultChars = [...mandatoryChars];

        // 6. Rút ngẫu nhiên các ký tự còn lại từ pool cho đủ độ dài
        for (let i = 0; i < remainingLength; i++) {
            const randomIndex = getRandomCryptoInt(pool.length);
            resultChars.push(pool[randomIndex]);
        }

        // 7. Xáo trộn ngẫu nhiên thứ tự các ký tự để các ký tự bắt buộc không bị đứng đầu
        const finalPassword = shuffleArray(resultChars);

        // 8. Đưa mật khẩu hoàn chỉnh lên ô hiển thị trên giao diện
        elements.passwordInput.value = finalPassword;

        // 9. Đánh giá và cập nhật thanh hiển thị độ mạnh của mật khẩu vừa tạo
        evaluateStrength(finalPassword, pool.length);
    }

    /**
     * Sao chép mật khẩu hiện tại vào Clipboard và tạo phản hồi hình ảnh trên nút Copy
     */
    async function handleCopyToClipboard() {
        // 1. Lấy giá trị mật khẩu từ ô input
        const password = elements.passwordInput.value;
        
        // 2. Nếu không có mật khẩu thì thoát hàm, không làm gì cả
        if (!password) return;

        try {
            // 3. Thực hiện ghi mật khẩu vào bộ nhớ tạm hệ thống (chờ xử lý xong)
            await navigator.clipboard.writeText(password);
            
            // 4. Lấy thẻ span chứa chữ bên trong nút Copy và lưu chữ gốc ban đầu
            const copyText = elements.btnCopy.querySelector('span');
            const originalText = copyText.textContent;
            
            // 5. Đổi chữ và đổi màu nút sang xanh lá để báo hiệu đã copy thành công
            copyText.textContent = 'Copied!';
            elements.btnCopy.style.borderColor = '#22c55e';
            elements.btnCopy.style.color = '#22c55e';

            // 6. Sau 2 giây (2000ms), tự động trả nút bấm về trạng thái màu sắc và chữ ban đầu
            setTimeout(() => {
                copyText.textContent = originalText;
                elements.btnCopy.style.borderColor = '';
                elements.btnCopy.style.color = '';
            }, 2000);
        } catch (err) {
            // 7. In thông báo lỗi ra Console nếu copy thất bại
            console.error('Failed to copy: ', err);
        }
    }

    // ==========================================
    // 8. EVENT BINDING & INITIALIZATION
    // ==========================================

    /**
     * Xử lý sự kiện khi kéo thanh slider chỉnh độ dài mật khẩu
     */
    function handleLengthSliderInput(e) {
        // Cập nhật con số hiển thị độ dài trên giao diện
        elements.lengthValue.textContent = e.target.value;
        
        // Tự động sinh mật khẩu mới theo độ dài mới
        handlePasswordGeneration();
    }

    /**
     * Đăng ký tất cả các sự kiện tương tác của người dùng trên trang web
     */
    function registerEvents() {
        // Lắng nghe sự kiện đổi Theme từ thẻ select
        elements.themeSelect.addEventListener('change', handleThemeChange);
        
        // Lắng nghe sự kiện kéo thanh slider độ dài (cập nhật realtime)
        elements.lengthSlider.addEventListener('input', handleLengthSliderInput);
        
        // Lắng nghe sự kiện bấm nút Tạo mật khẩu
        elements.btnGenerate.addEventListener('click', handlePasswordGeneration);
        
        // Lắng nghe sự kiện bấm nút Copy
        elements.btnCopy.addEventListener('click', handleCopyToClipboard);

        // Gom danh sách các ô checkbox điều kiện
        const checkBoxes = [
            elements.boxUppercase, 
            elements.boxLowercase, 
            elements.boxNumbers, 
            elements.boxSymbols
        ];

        // Lặp qua từng checkbox và tự động tạo lại mật khẩu mỗi khi trạng thái tích chọn thay đổi
        checkBoxes.forEach(box => {
            box.addEventListener('change', handlePasswordGeneration);
        });
    }

    /**
     * Hàm khởi chạy toàn bộ ứng dụng
     */
    function initApp() {
        initTheme();                 // 1. Áp dụng giao diện đã lưu
        registerEvents();            // 2. Kích hoạt lắng nghe các sự kiện
        handlePasswordGeneration();  // 3. Sinh sẵn một mật khẩu mặc định ban đầu
    }

    // Gọi hàm để chạy ứng dụng ngay khi Script được nạp xong
    initApp();
});