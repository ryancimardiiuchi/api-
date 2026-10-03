   function mostrarSenha() {

            const senha =
                document.getElementById("senha");

            const botao =
                document.querySelector(".show-password");

            if (senha.type === "password") {

                senha.type = "text";

                botao.textContent = "🙈";

            } else {

                senha.type = "password";

                botao.textContent = "👁️";

            }

        }
