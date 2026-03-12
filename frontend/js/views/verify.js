import { auth, markVerified } from "../services/auth.service.js";
import { verifyCode } from "../services/api.service.js";
import { navigate } from "../router.js";

export function initVerifyView() {
    document.getElementById("verify-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const codeInput = document.getElementById("verify-code");
        const errorMsg = document.getElementById("verify-error");

        const data = await verifyCode(auth.currentUser.uid, codeInput.value);

        if (data.success) {
            await markVerified(auth.currentUser.uid);
            navigate("home");
        } else {
            errorMsg.style.display = "block";
        }
    });
}
