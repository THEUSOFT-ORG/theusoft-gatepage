 // Variáveis para controlar o tempo mínimo do preloader
        let pageLoaded = false;
        let minTimeElapsed = false;
        
        // Função para esconder o preloader quando ambas as condições forem atendidas
        function hidePreloaderIfReady() {
            if (pageLoaded && minTimeElapsed) {
                const preloader = document.getElementById('preloader');
                
                // Adiciona classe para animação de saída
                preloader.classList.add('hidden');
                
                // Remove o preloader do DOM após a transição
                setTimeout(function() {
                    preloader.style.display = 'none';
                }, 800); // Tempo da transição
            }
        }
        
        // Marca que a página foi carregada
        window.addEventListener('load', function() {
            pageLoaded = true;
            hidePreloaderIfReady();
        });
        
        // Inicia o temporizador para o tempo mínimo de 3 segundos
        setTimeout(function() {
            minTimeElapsed = true;
            hidePreloaderIfReady();
        }, 5000); // 5 segundos mínimo
        
        // Inicializa as funcionalidades da página após o preloader
        function initPageFunctionality() {
            // Atualizar saudação conforme horário
            function updateGreeting() {
                const hour = new Date().getHours();
                const greetingElement = document.getElementById('greeting');
                let greeting;
                
                if (hour >= 5 && hour < 12) {
                    greeting = "Böm dia!";
                } else if (hour >= 12 && hour < 18) {
                    greeting = "Böa tarde!";
                } else if (hour >= 18 && hour < 24) {
                    greeting = "Böa noite!";
                } else {
                    greeting = "Böa madrugada!";
                }
                
                greetingElement.textContent = greeting;
            }
            
            // Atualizar a saudação imediatamente e a cada minuto
            updateGreeting();
            setInterval(updateGreeting, 60000);
            
            // Efeito de digitação para a mensagem
            const message = "Estamos passando por uma manutenção rápida! Nossos servidores estarão de volta em breve. Agradecemos sua paciência e compreensão.";
            let i = 0;
            const speed = 40;
            const messageElement = document.querySelector('.message');
            
            // Iniciar efeito de digitação
            function typeWriter() {
                if (i < message.length) {
                    messageElement.innerHTML = message.substring(0, i+1);
                    i++;
                    setTimeout(typeWriter, speed);
                }
            }
            
            // Inicia a digitação após um pequeno delay
            setTimeout(typeWriter, 500);
            
            // Prevenir comportamento padrão de arrastar e selecionar
            document.addEventListener('dragstart', function(e) {
                e.preventDefault();
            });
            
            document.addEventListener('selectstart', function(e) {
                e.preventDefault();
            });
        }
        
        // Inicia as funcionalidades após um pequeno delay
        setTimeout(initPageFunctionality, 500)
	