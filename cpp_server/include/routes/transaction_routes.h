#pragma once

#include "../common.h"

class HttpServer;

class TransactionRoutes {
public:
    static void setup(HttpServer& server);
    
private:
    // 交易相关的处理函数
    static void createTransaction(const http::Request& req, http::Response& res);
    static void estimateGas(const http::Request& req, http::Response& res);
    static void getGasPrice(const http::Request& req, http::Response& res);
    static void broadcastTransaction(const http::Request& req, http::Response& res);
    static void getTransactionStatus(const http::Request& req, http::Response& res);
    static void getTransactionHistory(const http::Request& req, http::Response& res);
    static void getTransactionDetail(const http::Request& req, http::Response& res);
    static void cancelTransaction(const http::Request& req, http::Response& res);
}; 