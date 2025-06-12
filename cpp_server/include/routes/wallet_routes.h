#pragma once

#include "../common.h"

class HttpServer;

class WalletRoutes {
public:
    static void setup(HttpServer& server);
    
private:
    // 钱包相关的处理函数
    static void createWallet(const http::Request& req, http::Response& res);
    static void importWallet(const http::Request& req, http::Response& res);
    static void getWalletList(const http::Request& req, http::Response& res);
    static void getWalletById(const http::Request& req, http::Response& res);
    static void getWalletBalance(const http::Request& req, http::Response& res);
    static void deleteWallet(const http::Request& req, http::Response& res);
}; 