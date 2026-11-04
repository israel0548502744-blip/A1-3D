package com.bambucontrol.studio

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.webkit.CookieManager
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Shows the home Bambuddy web UI full-screen. The app itself holds no printer
 * credentials: everything (slicing, printer control) happens on the server.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var errorView: View
    private var serverUrl: String = ""
    private var pendingFileCallback: ValueCallback<Array<Uri>>? = null

    private val pickFiles = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val data = res.data
        val uris: Array<Uri>? = when {
            res.resultCode != RESULT_OK || data == null -> null
            data.clipData != null -> Array(data.clipData!!.itemCount) { data.clipData!!.getItemAt(it).uri }
            data.data != null -> arrayOf(data.data!!)
            else -> null
        }
        pendingFileCallback?.onReceiveValue(uris)
        pendingFileCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val saved = ServerConfig.get(this)
        if (saved == null || intent?.action == ACTION_CHANGE_SERVER) {
            startActivity(Intent(this, SetupActivity::class.java))
            if (saved == null) { finish(); return }
        }
        serverUrl = saved

        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        val root = findViewById<View>(R.id.root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        webView = findViewById(R.id.webview)
        errorView = findViewById(R.id.error_view)
        findViewById<Button>(R.id.retry_button).setOnClickListener { reload() }
        findViewById<Button>(R.id.change_server_button).setOnClickListener {
            startActivity(Intent(this, SetupActivity::class.java))
        }

        setupWebView()
        if (savedInstanceState != null) webView.restoreState(savedInstanceState) else webView.loadUrl(serverUrl)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    override fun onResume() {
        super.onResume()
        // The address may have been changed in SetupActivity.
        val current = ServerConfig.get(this)
        if (::webView.isInitialized && current != null && current != serverUrl) {
            serverUrl = current
            reload()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        if (::webView.isInitialized) webView.saveState(outState)
    }

    private fun reload() {
        errorView.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.loadUrl(serverUrl)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                val serverHost = Uri.parse(serverUrl).host
                // Stay inside the app for the home server; open anything else in the browser.
                if (url.host == serverHost) return false
                startActivity(Intent(Intent.ACTION_VIEW, url))
                return true
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) showError(error.description?.toString() ?: "")
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                pendingFileCallback?.onReceiveValue(null)
                pendingFileCallback = callback
                // STL/3MF/STEP have no reliable MIME types on Android, so allow any file.
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                }
                return try {
                    pickFiles.launch(intent); true
                } catch (e: Exception) {
                    pendingFileCallback = null; false
                }
            }
        }

        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            if (!url.startsWith("http")) {
                Toast.makeText(this, R.string.download_unsupported, Toast.LENGTH_LONG).show()
                return@setDownloadListener
            }
            val name = URLUtil.guessFileName(url, contentDisposition, mimeType)
            val req = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                addRequestHeader("User-Agent", userAgent)
                CookieManager.getInstance().getCookie(url)?.let { addRequestHeader("Cookie", it) }
                setTitle(name)
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
            }
            (getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(req)
            Toast.makeText(this, getString(R.string.download_started, name), Toast.LENGTH_SHORT).show()
        }
    }

    private fun showError(detail: String) {
        webView.visibility = View.GONE
        errorView.visibility = View.VISIBLE
        findViewById<TextView>(R.id.error_detail).text = getString(R.string.error_detail, serverUrl, detail)
    }

    companion object {
        const val ACTION_CHANGE_SERVER = "com.bambucontrol.studio.CHANGE_SERVER"
    }
}
