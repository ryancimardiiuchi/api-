   function mostrarSenha() {

            const senha =
                document.getElementById("senha");

            if (senha.type === "password") {

                senha.type = "text";

              

            } else {

                senha.type = "password";


            }

        }
export default mostrarSenha