#pragma once

#include "../common.h"

class HttpServer;

class BlockchainRoutes {
public:
    static void setup(HttpServer& server);
    
private:
    // 区块链相关的处理函数
    static void getNetworkInfo(const http::Request& req, http::Response& res);
    static void getLatestBlock(const http::Request& req, http::Response& res);
    static void getBalance(const http::Request& req, http::Response& res);
    static void getNonce(const http::Request& req, http::Response& res);
    static void validateAddress(const http::Request& req, http::Response& res);
    static void getTokenBalance(const http::Request& req, http::Response& res);
    static void getTokenInfo(const http::Request& req, http::Response& res);
    static void getBlock(const http::Request& req, http::Response& res);
    static void search(const http::Request& req, http::Response& res);
}; 