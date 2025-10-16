// Registra o plugin de datalabels globalmente para todos os gráficos
Chart.register(ChartDataLabels);

const isMobile = window.innerWidth < 768;
const form = document.getElementById('contact-form');
const statusDiv = document.getElementById('form-status');
const submitButton = form.querySelector('button[type="submit"]');
const phoneInput = document.getElementById('telefone1');

// Função para aplicar a máscara de telefone
const handlePhoneInput = (event) => {
    let input = event.target;
    // Remove todos os caracteres que não são dígitos
    input.value = input.value.replace(/\D/g, '');
    let value = input.value;

    // Aplica a máscara dinamicamente
    if (value.length > 10) {
        // Celular: (XX) XXXXX-XXXX
        input.value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
        // Fixo: (XX) XXXX-XXXX
        input.value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
        input.value = value.replace(/^(\d{2})(\d*)/, '($1) $2');
    }
};

// Adiciona o evento 'input' ao campo de telefone
phoneInput.addEventListener('input', handlePhoneInput);

form.addEventListener('submit', function(e) {
    e.preventDefault(); // Impede o envio padrão do formulário

    const scriptURL = 'https://script.google.com/macros/s/AKfycbwP50raofUOrLc6sDKrv5nlhKbu6qj9vy3q_irFMrPRKcgcY6Zas7KhujAJKcfOVJY/exec';
    const formData = new FormData(form);

    submitButton.disabled = true;
    statusDiv.textContent = 'Enviando...';

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            if (response.ok) {
                statusDiv.textContent = 'Dados enviados com sucesso!';
                statusDiv.style.color = 'green';
                form.reset(); // Limpa o formulário
            } else {
                throw new Error('Erro no envio.');
            }
        })
        .catch(error => {
            console.error('Error!', error.message);
            statusDiv.textContent = 'Ocorreu um erro. Tente novamente.';
            statusDiv.style.color = 'red';
        })
        .finally(() => {
            submitButton.disabled = false;
        });
});

// --- Lógica do Carrossel ---
const carousel = document.querySelector('.carousel');
const slidesContainer = document.querySelector('.carousel-slides');
const slides = document.querySelectorAll('.carousel-slide');
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');
const dotsContainer = document.querySelector('.carousel-dots');
const benefitItems = document.querySelectorAll('.benefit-item');
let slideInterval;

let currentSlide = 0;
let analysisChartInstance = null;
let integrationChartInstance = null;
let biChartInstance = null;

// Criar os pontos de navegação
slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
        stopSlideShow(); // Para o temporizador atual
        goToSlide(i);    // Vai para o slide clicado
        startSlideShow(); // Reinicia o temporizador
    });
    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.carousel-dot');

const goToSlide = (slideIndex) => {
    slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;

    // Atualiza o dot e o benefício ativos
    dots[currentSlide].classList.remove('active');
    benefitItems[currentSlide].classList.remove('active');

    dots[slideIndex].classList.add('active');
    benefitItems[slideIndex].classList.add('active');

    currentSlide = slideIndex;

    // Se o slide for o do gráfico, cria ou atualiza o gráfico
    if (!isMobile) {
        if (slideIndex === 0) {
            createOrUpdateAnalysisChart();
        } else if (slideIndex === 1) {
            createOrUpdateIntegrationChart();
        } else if (slideIndex === 2) {
            createOrUpdateBiChart();
        }
    }
};

const handleNextSlide = () => {
    let nextSlide = currentSlide + 1;
    if (nextSlide >= slides.length) {
        nextSlide = 0; // Volta para o primeiro
    }
    goToSlide(nextSlide);
};

const startSlideShow = () => {
    stopSlideShow(); // Garante que qualquer temporizador antigo seja limpo antes de criar um novo
    slideInterval = setInterval(handleNextSlide, 5000); // Troca a cada 5 segundos
};

const stopSlideShow = () => {
    clearInterval(slideInterval);
};

nextButton.addEventListener('click', () => {
    stopSlideShow();
    handleNextSlide();
    startSlideShow();
});

prevButton.addEventListener('click', () => {
    stopSlideShow();
    let prevSlide = currentSlide - 1;
    if (prevSlide < 0) {
        prevSlide = slides.length - 1; // Vai para o último
    }
    goToSlide(prevSlide);
    startSlideShow();
});

// --- Lógica do Seletor de Tema ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Verifica a preferência salva no localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    body.classList.add('light-theme');
    themeToggle.checked = true;
}

themeToggle.addEventListener('change', () => {
    body.classList.toggle('light-theme');

    // Salva a preferência do usuário
    localStorage.setItem('theme', body.classList.contains('light-theme') ? 'light' : 'dark');

    // Atualiza as cores do gráfico se ele já existir
    if (analysisChartInstance) {
        createOrUpdateAnalysisChart();
    }
    if (integrationChartInstance) {
        createOrUpdateIntegrationChart();
    }
    if (biChartInstance) {
        createOrUpdateBiChart();
    }
});

// --- Funções dos Gráficos (Chart.js) ---
function getChartColors() {
    const isLightTheme = body.classList.contains('light-theme');
    return {
        gridColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        labelColor: isLightTheme ? '#000' : '#fff', // Cor para legendas (ex: "Vendas (em Milhares)")
        tickColor: isLightTheme ? '#000' : '#fff', // Cor para os números dos eixos
        datalabelColor: '#fff', // Cor para a % dentro do gráfico de rosca (sempre branca)
        fontSize: isMobile ? 10 : 12, // Tamanho da fonte adaptativo
        barColor: isLightTheme ? 'rgba(0, 86, 179, 0.8)' : 'rgba(74, 144, 226, 0.8)',
        barHoverColor: isLightTheme ? 'rgba(0, 123, 255, 1)' : 'rgba(99, 164, 255, 1)',
        lineColor: isLightTheme ? '#218838' : '#28a745',
        doughnutColors: isLightTheme ? ['#0056b3', '#007bff', '#28a745'] : ['#4a90e2', '#63a4ff', '#28a745']
    };
}

function createOrUpdateAnalysisChart(canvasId = 'analysisChart') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const colors = getChartColors();
    const data = {
        labels: ['CRM', 'ERP', 'Planilhas'],
        datasets: [{
            label: 'Fontes de Dados',
            data: [55, 25, 20],
            backgroundColor: colors.doughnutColors,
            hoverOffset: 4
        }]
    };
    const options = {
        responsive: true, maintainAspectRatio: true,
        plugins: {
            legend: {
                position: window.innerWidth < 768 ? 'bottom' : 'right', // Posição da legenda adaptativa
                align: 'center',   // Alinha a legenda verticalmente ao centro
                labels: { color: colors.labelColor, font: { size: colors.fontSize } }
            },
            datalabels: {
                formatter: (value, ctx) => {
                    const datapoints = ctx.chart.data.datasets[0].data;
                    const total = datapoints.reduce((total, datapoint) => total + datapoint, 0);
                    const percentage = (value / total * 100).toFixed(0);
                    return `${percentage}%`;
                },
                color: colors.datalabelColor,
                font: {
                    weight: 'bold',
                    size: window.innerWidth < 768 ? 14 : 16, // Tamanho da % adaptativo
                }
            }
        }
    };
    if (analysisChartInstance) analysisChartInstance.destroy();
    analysisChartInstance = new Chart(ctx, { type: 'doughnut', data, options });
}

function createOrUpdateIntegrationChart(canvasId = 'integrationChart') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const colors = getChartColors();
    const data = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            label: 'Eficiência Operacional (%)',
            data: [45, 62, 78, 91],
            fill: false,
            borderColor: colors.lineColor,
            tension: 0.1
        }]
    };
    const options = {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { labels: { color: colors.labelColor, font: { size: colors.fontSize } } } },
        scales: {
            y: { beginAtZero: false, ticks: { color: colors.tickColor, font: { weight: 'bold', size: colors.fontSize } }, grid: { color: colors.gridColor } },
            x: { ticks: { color: colors.tickColor, font: { weight: 'bold', size: colors.fontSize } }, grid: { color: 'transparent' } }
        }
    };
    if (integrationChartInstance) integrationChartInstance.destroy();
    integrationChartInstance = new Chart(ctx, { type: 'line', data, options });
}

function createOrUpdateBiChart(canvasId = 'biChart') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const colors = getChartColors();

    const data = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
            label: 'Vendas (em Milhares)',
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: colors.barColor,
            borderColor: colors.barColor,
            borderWidth: 1,
            hoverBackgroundColor: colors.barHoverColor
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: { color: colors.labelColor, font: { size: colors.fontSize } }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: colors.tickColor, font: { weight: 'bold', size: colors.fontSize } },
                grid: { color: colors.gridColor }
            },
            x: {
                ticks: { color: colors.tickColor, font: { weight: 'bold', size: colors.fontSize } },
                grid: { color: 'transparent' }
            }
        }
    };
    if (biChartInstance) biChartInstance.destroy();
    biChartInstance = new Chart(ctx, { type: 'bar', data, options });
}

// --- Lógica do Modal ---
const modal = document.getElementById('chart-modal');
const modalCloseButton = document.querySelector('.modal-close');
const openChartButtons = document.querySelectorAll('.open-chart-button');

function openModal(chartType) {
    modal.style.display = 'flex';
    // Cria o gráfico específico dentro do canvas do modal
    if (chartType === 'analysis') {
        createOrUpdateAnalysisChart('modalChart');
    } else if (chartType === 'integration') {
        createOrUpdateIntegrationChart('modalChart');
    } else if (chartType === 'bi') {
        createOrUpdateBiChart('modalChart');
    }
}

function closeModal() {
    modal.style.display = 'none';
    // Destrói o gráfico do modal para liberar memória
    if (analysisChartInstance) analysisChartInstance.destroy();
    if (integrationChartInstance) integrationChartInstance.destroy();
    if (biChartInstance) biChartInstance.destroy();
}

openChartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const chartType = e.currentTarget.dataset.chartType;
        openModal(chartType);
    });
});

modalCloseButton.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Inicia no primeiro slide (agora que todas as funções foram definidas)
goToSlide(0);

// Inicia o autoplay e adiciona pausa no hover
startSlideShow();
carousel.addEventListener('mouseenter', stopSlideShow);
carousel.addEventListener('mouseleave', startSlideShow);

// --- Lógica de Animação de Scroll ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Anima só uma vez
        }
    });
}, {
    threshold: 0.1 // Ativa quando 10% do elemento estiver visível
});

const elementsToAnimate = document.querySelectorAll('.fade-in-element');
elementsToAnimate.forEach((el) => observer.observe(el));