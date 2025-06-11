package com.mpcwallet.app.data.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import android.content.Context
import com.mpcwallet.app.data.models.MPCKeyShare

@Database(
    entities = [MPCKeyShare::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class MPCWalletDatabase : RoomDatabase() {
    
    abstract fun keyShareDao(): KeyShareDao
    
    companion object {
        @Volatile
        private var INSTANCE: MPCWalletDatabase? = null
        
        fun getDatabase(context: Context): MPCWalletDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MPCWalletDatabase::class.java,
                    "mpc_wallet_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
} 