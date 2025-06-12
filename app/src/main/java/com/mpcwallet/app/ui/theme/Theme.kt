package com.mpcwallet.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = md_theme_primary_dark,
    onPrimary = md_theme_on_primary_dark,
    primaryContainer = md_theme_primary_container_dark,
    onPrimaryContainer = md_theme_on_primary_container_dark,
    secondary = md_theme_secondary_dark,
    onSecondary = md_theme_on_secondary_dark,
    secondaryContainer = md_theme_secondary_container_dark,
    onSecondaryContainer = md_theme_on_secondary_container_dark,
    tertiary = md_theme_tertiary_dark,
    onTertiary = md_theme_on_tertiary_dark,
    tertiaryContainer = md_theme_tertiary_container_dark,
    onTertiaryContainer = md_theme_on_tertiary_container_dark,
    error = md_theme_error_dark,
    onError = md_theme_on_error_dark,
    errorContainer = md_theme_error_container_dark,
    onErrorContainer = md_theme_on_error_container_dark,
    background = md_theme_background_dark,
    onBackground = md_theme_on_background_dark,
    surface = md_theme_surface_dark,
    onSurface = md_theme_on_surface_dark,
    surfaceVariant = md_theme_surface_variant_dark,
    onSurfaceVariant = md_theme_on_surface_variant_dark,
    outline = md_theme_outline_dark,
    outlineVariant = md_theme_outline_variant_dark,
)

private val LightColorScheme = lightColorScheme(
    primary = md_theme_primary,
    onPrimary = md_theme_on_primary,
    primaryContainer = md_theme_primary_container,
    onPrimaryContainer = md_theme_on_primary_container,
    secondary = md_theme_secondary,
    onSecondary = md_theme_on_secondary,
    secondaryContainer = md_theme_secondary_container,
    onSecondaryContainer = md_theme_on_secondary_container,
    tertiary = md_theme_tertiary,
    onTertiary = md_theme_on_tertiary,
    tertiaryContainer = md_theme_tertiary_container,
    onTertiaryContainer = md_theme_on_tertiary_container,
    error = md_theme_error,
    onError = md_theme_on_error,
    errorContainer = md_theme_error_container,
    onErrorContainer = md_theme_on_error_container,
    background = md_theme_background,
    onBackground = md_theme_on_background,
    surface = md_theme_surface,
    onSurface = md_theme_on_surface,
    surfaceVariant = md_theme_surface_variant,
    onSurfaceVariant = md_theme_on_surface_variant,
    outline = md_theme_outline,
    outlineVariant = md_theme_outline_variant,
)

@Composable
fun MPCWalletTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = android.graphics.Color.TRANSPARENT
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
} 