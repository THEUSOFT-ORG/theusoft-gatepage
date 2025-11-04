/**
 * @fileoverview Script de gerenciamento de preloader e redirecionamento
 * @module PreloaderManager
 * @version 1.2.0
 * @copyright © 2025.3 ṪHEÜSOFT – ṪECNOLOGIA QÜE APRÖXIMA, EDÜCAÇÃO QÜE TRANSFÖRMA
 * @license MIT
 */

// CONSTANTES DE CONFIGURAÇÃO
const CONFIG = {
   PRELOADER_MIN_DISPLAY_TIME: 2000,
   REDIRECT_DELAY: 800,
   HEALTH_CHECK_TIMEOUT: 5000,
   TYPING_SPEED: 40,
   GREETING_UPDATE_INTERVAL: 60000,
   SERVER_HEALTH_URL: 'https://theusoft.shop/health',
   REDIRECT_URL: 'https://theusoft.shop/',
   MAX_RETRY_ATTEMPTS: 2,
   RETRY_DELAY: 1000
};

// Variáveis de estado do aplicativo
let appState = {
   pageLoaded: false,
   minTimeElapsed: false,
   isServerOnline: null,
   healthCheckRetries: 0,
   typingInterval: null,
   greetingInterval: null,
   isRedirecting: false
};

// Seletores de elementos DOM
const DOM_SELECTORS = {
   preloader: '#preloader',
   greeting: '#greeting',
   message: '.message',
   copyright: '#copyright-notice'
};

/**
 * Verifica o status do servidor com tratamento robusto de CORS e erros
 * @async
 * @function checkServerStatus
 * @returns {Promise<boolean>} True se o servidor estiver online, false caso contrário
 */
async function checkServerStatus() {
   // Se já excedeu o número máximo de tentativas, retorna offline
   if(appState.healthCheckRetries >= CONFIG.MAX_RETRY_ATTEMPTS) {
      console.log('❌ Número máximo de tentativas excedido, considerando servidor offline');
      return false;
   }

   try {
      console.log(`🔍 Verificando status do servidor: ${CONFIG.SERVER_HEALTH_URL}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.HEALTH_CHECK_TIMEOUT);

      const response = await fetch(CONFIG.SERVER_HEALTH_URL, {
         method: 'GET',
         cache: 'no-store',
         referrerPolicy: 'no-referrer',
         signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📊 Resposta do servidor: Status ${response.status} ${response.statusText}`);

      // Considera online se o status for 2xx
      const isOnline = response.ok;
      if(isOnline) {
         console.log('✅ Servidor online, pronto para redirecionar');
      } else {
         console.log(`❌ Servidor respondeu com erro: ${response.status}`);
      }

      return isOnline;
   } catch (error) {
      // Log específico para diferentes tipos de erro
      if(error.name === 'AbortError') {
         console.log('⏰ Timeout na verificação do servidor');
         appState.healthCheckRetries++;
         await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
         return checkServerStatus();
      } else if(error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
         console.log('🌐 Erro de rede/CORS na verificação do servidor');
      } else {
         console.log(`⚠️ Erro inesperado: ${error.message}`);
      }

      appState.healthCheckRetries++;
      return false;
   }
}

/**
 * Verifica o status do servidor usando uma abordagem alternativa por imagem
 * Útil para contornar limitações de CORS
 * @async
 * @function checkServerStatusWithImage
 * @returns {Promise<boolean>} True se o servidor estiver online
 */
async function checkServerStatusWithImage() {
   console.log('🖼️ Tentando verificação alternativa por imagem');
   return new Promise((resolve) => {
      const img = new Image();
      let resolved = false;

      // Timeout para evitar que fique travado
      const timeoutId = setTimeout(() => {
         if(!resolved) {
            resolved = true;
            console.log('⏰ Timeout na verificação por imagem');
            resolve(false);
         }
      }, CONFIG.HEALTH_CHECK_TIMEOUT);

      img.onload = () => {
         if(!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            console.log('✅ Verificação por imagem: servidor online');
            resolve(true);
         }
      };

      img.onerror = () => {
         if(!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            console.log('❌ Verificação por imagem: servidor offline');
            resolve(false);
         }
      };

      // Tenta carregar uma imagem do domínio (usando cache busting)
      img.src = `${CONFIG.SERVER_HEALTH_URL.replace('/health', '/favicon.ico')}?t=${Date.now()}`;
   });
}

/**
 * Verificação robusta de status do servidor usando múltiplos métodos
 * @async
 * @function robustServerStatusCheck
 * @returns {Promise<boolean>} True se o servidor estiver online
 */
async function robustServerStatusCheck() {
   console.log('🛡️ Iniciando verificação robusta do servidor');
   try {
      // Primeiro tenta o método tradicional
      const traditionalCheck = await checkServerStatus();
      if(traditionalCheck) {
         console.log('🎯 Método tradicional confirmou servidor online');
         return true;
      }

      console.log('🔄 Tentando método alternativo...');
      // Se falhou, tenta o método alternativo por imagem
      const imageCheck = await checkServerStatusWithImage();
      if(imageCheck) {
         console.log('🎯 Método alternativo confirmou servidor online');
      } else {
         console.log('❌ Todos os métodos indicam servidor offline');
      }
      return imageCheck;
   } catch (error) {
      console.log(`⚠️ Erro inesperado na verificação robusta: ${error.message}`);
      return false;
   }
}

/**
 * Oculta o preloader com transição suave
 * @function hidePreloader
 */
function hidePreloader() {
   console.log('👋 Ocultando preloader (servidor offline)');
   const preloader = document.querySelector(DOM_SELECTORS.preloader);
   if(!preloader) return;

   preloader.classList.add('hidden');
   setTimeout(() => {
      preloader.style.display = 'none';
   }, CONFIG.REDIRECT_DELAY);
}

/**
 * Redireciona para a URL especificada
 * @function redirectToHome
 */
function redirectToHome() {
   if(appState.isRedirecting) {
      console.log('⏭️ Redirecionamento já em andamento');
      return;
   }

   appState.isRedirecting = true;
   console.log(`🔀 Redirecionando para: ${CONFIG.REDIRECT_URL}`);

   // Pequeno delay para garantir que o usuário veja a transição
   setTimeout(() => {
      window.location.href = CONFIG.REDIRECT_URL;
   }, 300);
}

/**
 * Gerencia a lógica de esconder o preloader ou redirecionar
 * @async
 * @function handlePreloaderState
 */
async function handlePreloaderState() {
   if(!appState.pageLoaded || !appState.minTimeElapsed) {
      console.log(`⏳ Aguardando condições: pageLoaded=${appState.pageLoaded}, minTimeElapsed=${appState.minTimeElapsed}`);
      return;
   }

   console.log('🎯 Condições atendidas, verificando estado do servidor...');

   // Verifica status do servidor apenas uma vez
   if(appState.isServerOnline === null) {
      appState.isServerOnline = await robustServerStatusCheck();
   }

   if(appState.isServerOnline) {
      redirectToHome();
   } else {
      hidePreloader();
   }
}

/**
 * Atualiza a saudação conforme o horário do dia
 * @function updateGreeting
 */
function updateGreeting() {
   const hour = new Date()
      .getHours();
   const greetingElement = document.querySelector(DOM_SELECTORS.greeting);
   if(!greetingElement) return;

   let greeting;

   if(hour >= 5 && hour < 12) {
      greeting = "Böm dia!";
   } else if(hour >= 12 && hour < 18) {
      greeting = "Böa tarde!";
   } else if(hour >= 18 && hour < 24) {
      greeting = "Böa noite!";
   } else {
      greeting = "Böa madrugada!";
   }

   greetingElement.textContent = greeting;
}

/**
 * Atualiza dinamicamente o brand/copyright Ṫ͏͏HEÜSOFT
 * Formato: Ṫ͏͏HEÜSOFT™ © 2022–ANO.ETAPA All rights reserved
 */
function updateBrandCopyright() {
   const currentDate = new Date();
   const ano = currentDate.getFullYear();
   const mesNumero = currentDate.getMonth() + 1;

   // Define a etapa do ano (1 = jan-abr, 2 = mai-ago, 3 = set-dez)
   let etapa;
   if(mesNumero >= 1 && mesNumero <= 4) etapa = 1;
   else if(mesNumero >= 5 && mesNumero <= 8) etapa = 2;
   else etapa = 3;

   const anoEtapa = `${ano}.${etapa}`;
   const texto = `Ṫ͏͏HEÜSOFT™ © 2022–${anoEtapa} All rights reserved.`;

   // Atualiza o elemento de copyright no HTML
   const el = document.querySelector('#copyright-notice');
   if(el) el.textContent = texto;
}

// Executa ao carregar a página
document.addEventListener('DOMContentLoaded', updateBrandCopyright);

/**
 * Efeito de digitação para a mensagem de manutenção
 * @function typeWriter
 * @param {string} text - Texto a ser exibido com efeito de digitação
 * @param {number} index - Índice atual do caractere
 * @param {number} speed - Velocidade de digitação em ms
 */
function typeWriter(text, index = 0, speed = CONFIG.TYPING_SPEED) {
   const messageElement = document.querySelector(DOM_SELECTORS.message);
   if(!messageElement || index > text.length) {
      if(appState.typingInterval) {
         clearTimeout(appState.typingInterval);
         appState.typingInterval = null;
      }
      return;
   }

   messageElement.textContent = text.substring(0, index);
   appState.typingInterval = setTimeout(() => typeWriter(text, index + 1, speed), speed);
}

/**
 * Previne comportamentos indesejados como arrastar e selecionar
 * @function preventUndesiredActions
 */
function preventUndesiredActions() {
   // Prevenir comportamento padrão de arrastar
   document.addEventListener('dragstart', (e) => {
      e.preventDefault();
   });

   // Prevenir seleção de texto
   document.addEventListener('selectstart', (e) => {
      e.preventDefault();
   });
}

/**
 * Inicializa as funcionalidades da página após o preloader
 * @function initPageFunctionality
 */
function initPageFunctionality() {
   console.log('🚀 Inicializando funcionalidades da página');

   // Configura a atualização de saudação
   updateGreeting();
   appState.greetingInterval = setInterval(updateGreeting, CONFIG.GREETING_UPDATE_INTERVAL);

   // Inicia efeito de digitação
   const message = "Estamos passando por uma manutenção rápida! Nossos servidores estarão de volta em breve. Agradecemos sua paciência e compreensão.";
   setTimeout(() => typeWriter(message), 500);

   // Previne ações indesejadas
   preventUndesiredActions();
}

/**
 * Limpa intervalos e timeouts para evitar vazamentos de memória
 * @function cleanupIntervals
 */
function cleanupIntervals() {
   if(appState.typingInterval) {
      clearTimeout(appState.typingInterval);
      appState.typingInterval = null;
   }
   if(appState.greetingInterval) {
      clearInterval(appState.greetingInterval);
      appState.greetingInterval = null;
   }
}

// EVENT LISTENERS

// Marca que a página foi carregada
window.addEventListener('load', () => {
   console.log('📄 Página completamente carregada');
   appState.pageLoaded = true;
   handlePreloaderState();
});

// Configura timeout para o tempo mínimo de exibição do preloader
setTimeout(() => {
   console.log('⏰ Tempo mínimo do preloader atingido');
   appState.minTimeElapsed = true;
   handlePreloaderState();
}, CONFIG.PRELOADER_MIN_DISPLAY_TIME);

// Inicia as funcionalidades após um pequeno delay
setTimeout(initPageFunctionality, 500);

// Limpa os intervalos quando a página é descarregada
window.addEventListener('beforeunload', cleanupIntervals);
window.addEventListener('unload', cleanupIntervals);

// Tratamento de erros não capturados
window.addEventListener('error', (e) => {
   console.error('❌ Erro não capturado:', e.error);
});

// Tratamento de promessas rejeitadas não tratadas
window.addEventListener('unhandledrejection', (e) => {
   console.warn('⚠️ Promessa rejeitada não tratada:', e.reason);
   e.preventDefault();
});

// Inicialização do módulo
console.log('🔧 PreloaderManager inicializado - © 2025.3 ṪHEÜSOFT');
