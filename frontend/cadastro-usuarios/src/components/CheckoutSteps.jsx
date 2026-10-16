import "./checkoutSteps.css";

const steps = ["Endereço", "Pagamento", "Confirmação"];

function CheckoutSteps({ currentStep }) {
  return (
    <nav className="checkout-steps" aria-label="Etapas do pedido">
      {steps.map((label, index) => {
        const step = index + 1;
        const concluida = step < currentStep;
        const ativa = step === currentStep;

        return (
          <div className="checkout-step-group" key={label}>
            <div
              className={`checkout-step${concluida ? " concluida" : ""}${ativa ? " ativa" : ""}`}
              aria-current={ativa ? "step" : undefined}
            >
              <span className="checkout-step-number">
                {concluida ? "✓" : step}
              </span>
              <span className="checkout-step-label">{label}</span>
            </div>
            {step < steps.length && (
              <span
                className={`checkout-step-line${concluida ? " concluida" : ""}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default CheckoutSteps;
