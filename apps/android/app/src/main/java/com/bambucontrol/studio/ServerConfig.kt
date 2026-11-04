package com.bambucontrol.studio

import android.content.Context
import java.net.HttpURLConnection
import java.net.URL

/** Stores and validates the address of the home Bambuddy server. */
object ServerConfig {
    private const val PREFS = "server"
    private const val KEY_URL = "url"

    fun get(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_URL, null)

    fun save(context: Context, url: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_URL, url).apply()
    }

    /** "bambu-pc:8000" -> "http://bambu-pc:8000". Returns null if it can't be a URL. */
    fun normalize(input: String): String? {
        var s = input.trim().trimEnd('/')
        if (s.isEmpty()) return null
        if (!s.startsWith("http://") && !s.startsWith("https://")) s = "http://$s"
        return try {
            val u = URL(s)
            if (u.host.isNullOrEmpty()) null else s
        } catch (e: Exception) {
            null
        }
    }

    sealed class Probe {
        data class Ok(val code: Int) : Probe()
        data class Failed(val reason: String) : Probe()
    }

    /** Real HTTP request to the server. Must be called off the main thread. */
    fun probe(url: String): Probe = try {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 5000
        conn.readTimeout = 5000
        conn.instanceFollowRedirects = true
        val code = conn.responseCode
        conn.disconnect()
        if (code in 200..499) Probe.Ok(code) else Probe.Failed("HTTP $code")
    } catch (e: Exception) {
        Probe.Failed(e.javaClass.simpleName + (e.message?.let { ": $it" } ?: ""))
    }
}
