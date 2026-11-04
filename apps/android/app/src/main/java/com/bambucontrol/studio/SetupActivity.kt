package com.bambucontrol.studio

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import kotlin.concurrent.thread

/** First-run (and "change server") screen: enter and verify the Bambuddy address. */
class SetupActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_setup)
        val root = findViewById<View>(R.id.root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        val input = findViewById<EditText>(R.id.server_input)
        val button = findViewById<Button>(R.id.connect_button)
        val status = findViewById<TextView>(R.id.status)
        val progress = findViewById<ProgressBar>(R.id.progress)

        ServerConfig.get(this)?.let { input.setText(it) }

        button.setOnClickListener {
            val url = ServerConfig.normalize(input.text.toString())
            if (url == null) {
                status.setText(R.string.setup_invalid)
                return@setOnClickListener
            }
            button.isEnabled = false
            progress.visibility = View.VISIBLE
            status.setText(R.string.setup_checking)
            thread {
                val result = ServerConfig.probe(url)
                runOnUiThread {
                    button.isEnabled = true
                    progress.visibility = View.GONE
                    when (result) {
                        is ServerConfig.Probe.Ok -> {
                            ServerConfig.save(this, url)
                            startActivity(Intent(this, MainActivity::class.java)
                                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK))
                            finish()
                        }
                        is ServerConfig.Probe.Failed ->
                            status.text = getString(R.string.setup_failed, result.reason)
                    }
                }
            }
        }
    }
}
