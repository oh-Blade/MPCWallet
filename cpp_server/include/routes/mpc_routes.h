#pragma once

#include "../common.h"

class HttpServer;

class MpcRoutes {
public:
    static void setup(HttpServer& server);
    
private:
    // MPC相关的处理函数
    static void startKeyGeneration(const http::Request& req, http::Response& res);
    static void joinKeyGeneration(const http::Request& req, http::Response& res);
    static void startSigning(const http::Request& req, http::Response& res);
    static void getSessionStatus(const http::Request& req, http::Response& res);
    static void addParticipantData(const http::Request& req, http::Response& res);
    static void getActiveSessions(const http::Request& req, http::Response& res);
    static void submitParticipantData(const http::Request& req, http::Response& res);
}; 