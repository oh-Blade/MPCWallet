package com.mpcwallet.mobile.core.security

import android.util.Base64
import timber.log.Timber
import java.nio.charset.StandardCharsets
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import kotlin.random.Random

class KeyMaterialCipher(
    private val keyAlias: String = DEFAULT_ALIAS
) {
    companion object {
        private const val DEFAULT_ALIAS = "mpc_device_share_key"
        private const val AES_TRANSFORMATION = "AES/GCM/NoPadding"
        private const val GCM_TAG_BITS = 128
        private const val IV_SIZE_BYTES = 12
    }

    /**
     * WHY: Device share materials must be encrypted at rest even with software fallback enabled,
     * to reduce direct extraction risk from filesystem-level compromise.
     */
    fun encrypt(plaintext: String, keyBytes: ByteArray): String {
        require(keyBytes.size == 32) { "keyBytes must be 32 bytes for AES-256" }
        val iv = Random.Default.nextBytes(IV_SIZE_BYTES)
        val cipher = Cipher.getInstance(AES_TRANSFORMATION).apply {
            init(Cipher.ENCRYPT_MODE, SecretKeySpec(keyBytes, "AES"), GCMParameterSpec(GCM_TAG_BITS, iv))
        }
        val encrypted = cipher.doFinal(plaintext.toByteArray(StandardCharsets.UTF_8))
        val merged = iv + encrypted
        Timber.i("event=device_share_encrypted key_alias=%s payload_size=%d", keyAlias, plaintext.length)
        return Base64.encodeToString(merged, Base64.NO_WRAP)
    }

    fun decrypt(encoded: String, keyBytes: ByteArray): String {
        require(keyBytes.size == 32) { "keyBytes must be 32 bytes for AES-256" }
        val merged = Base64.decode(encoded, Base64.NO_WRAP)
        require(merged.size > IV_SIZE_BYTES) { "encrypted payload too short" }
        val iv = merged.copyOfRange(0, IV_SIZE_BYTES)
        val ciphertext = merged.copyOfRange(IV_SIZE_BYTES, merged.size)

        val cipher = Cipher.getInstance(AES_TRANSFORMATION).apply {
            init(Cipher.DECRYPT_MODE, SecretKeySpec(keyBytes, "AES"), GCMParameterSpec(GCM_TAG_BITS, iv))
        }
        val plaintext = String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8)
        Timber.i("event=device_share_decrypted key_alias=%s payload_size=%d", keyAlias, plaintext.length)
        return plaintext
    }
}
