import UIKit
import WebKit
import Capacitor

class POAViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        injectScrollFixes()
    }

    private func injectScrollFixes() {
        let css = """
        /* Capacitor iOS: ensure scrollability when keyboard is visible */
        body {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
        """

        let js = """
        // Inject CSS
        (function() {
            var style = document.createElement('style');
            style.textContent = `\(css)`;
            document.head.appendChild(style);
        })();

        // Scroll focused input into view when keyboard appears
        document.addEventListener('focusin', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                setTimeout(function() {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
        """

        let script = WKUserScript(
            source: js,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )

        webView!.configuration.userContentController.addUserScript(script)
    }
}
