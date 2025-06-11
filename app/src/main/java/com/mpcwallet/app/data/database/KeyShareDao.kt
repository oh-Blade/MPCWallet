package com.mpcwallet.app.data.database

import androidx.room.*
import com.mpcwallet.app.data.models.MPCKeyShare
import com.mpcwallet.app.data.models.ChainType
import kotlinx.coroutines.flow.Flow

@Dao
interface KeyShareDao {
    
    @Query("SELECT * FROM mpc_key_shares ORDER BY createdAt DESC")
    fun getAllKeyShares(): Flow<List<MPCKeyShare>>
    
    @Query("SELECT * FROM mpc_key_shares WHERE id = :id")
    suspend fun getKeyShareById(id: String): MPCKeyShare?
    
    @Query("SELECT * FROM mpc_key_shares WHERE chainType = :chainType ORDER BY createdAt DESC")
    fun getKeySharesByChain(chainType: ChainType): Flow<List<MPCKeyShare>>
    
    @Query("SELECT * FROM mpc_key_shares WHERE partyId = :partyId ORDER BY createdAt DESC")
    fun getKeySharesByParty(partyId: String): Flow<List<MPCKeyShare>>
    
    @Query("SELECT * FROM mpc_key_shares WHERE address = :address")
    suspend fun getKeyShareByAddress(address: String): MPCKeyShare?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertKeyShare(keyShare: MPCKeyShare)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertKeyShares(keyShares: List<MPCKeyShare>)
    
    @Update
    suspend fun updateKeyShare(keyShare: MPCKeyShare)
    
    @Delete
    suspend fun deleteKeyShare(keyShare: MPCKeyShare)
    
    @Query("DELETE FROM mpc_key_shares WHERE id = :id")
    suspend fun deleteKeyShareById(id: String)
    
    @Query("DELETE FROM mpc_key_shares")
    suspend fun deleteAllKeyShares()
    
    @Query("SELECT COUNT(*) FROM mpc_key_shares")
    suspend fun getKeyShareCount(): Int
    
    @Query("SELECT COUNT(*) FROM mpc_key_shares WHERE chainType = :chainType")
    suspend fun getKeyShareCountByChain(chainType: ChainType): Int
} 