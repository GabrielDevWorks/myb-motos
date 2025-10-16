document.addEventListener('DOMContentLoaded', () => {
    // Seletores dos elementos do simulador
    const valorMotoInput = document.getElementById('valor-moto');
    const valorEntradaInput = document.getElementById('valor-entrada');
    const numParcelasSelect = document.getElementById('num-parcelas');
    const valorParcelaDisplay = document.getElementById('valor-parcela');

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function calcularParcela() {
        const valorMoto = parseFloat(valorMotoInput.value) || 0;
        let valorEntrada = parseFloat(valorEntradaInput.value) || 0;
        const numParcelas = parseInt(numParcelasSelect.value);

        // Garante que a entrada não seja maior que o valor da moto
        if (valorEntrada > valorMoto) {
            valorEntrada = valorMoto;
            valorEntradaInput.value = valorMoto;
        }

        const taxaJurosMensal = 0.0199;
        const valorFinanciado = valorMoto - valorEntrada;

        if (valorFinanciado <= 0) {
            valorParcelaDisplay.textContent = formatCurrency(0);
            return;
        }

        // Fórmula de amortização (Tabela Price)
        const parcela = valorFinanciado * (taxaJurosMensal * Math.pow(1 + taxaJurosMensal, numParcelas)) / (Math.pow(1 + taxaJurosMensal, numParcelas) - 1);

        valorParcelaDisplay.textContent = formatCurrency(parcela);
    }

    // Adiciona "ouvintes" para recalcular sempre que um valor mudar
    valorMotoInput.addEventListener('input', calcularParcela);
    valorEntradaInput.addEventListener('input', calcularParcela);
    numParcelasSelect.addEventListener('change', calcularParcela);

    // Calcula o valor inicial ao carregar a página
    calcularParcela();

    // Lógica do formulário de envio
    const financingForm = document.getElementById('financing-form');
    financingForm.addEventListener('submit', (event) => {
        event.preventDefault();
        alert('Próximo passo: conectar este formulário ao backend!');
    });
});