cmake_minimum_required(VERSION 3.15)
project(mpc_wallet_server)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 查找依赖包
find_package(PkgConfig REQUIRED)
find_package(Threads REQUIRED)
find_package(OpenSSL REQUIRED)

# 添加cb-mpc库的包含路径
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include/cb-mpc)

# 使用 Conan 包管理器或者手动链接库
# 这里假设使用 vcpkg 或者 conan 来管理依赖

# httplib (single header HTTP库)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/third_party)

# nlohmann json 库
find_package(nlohmann_json REQUIRED)

# 设置源文件
set(SOURCES
    src/main.cpp
    src/server.cpp
    src/routes/wallet_routes.cpp
    src/routes/transaction_routes.cpp
    src/routes/mpc_routes.cpp
    src/routes/blockchain_routes.cpp
    src/services/wallet_service.cpp
    src/services/transaction_service.cpp
    src/services/mpc_service.cpp
    src/services/blockchain_service.cpp
    src/utils/validation.cpp
    src/utils/json_utils.cpp
    src/utils/crypto_utils.cpp
)

# 创建可执行文件
add_executable(${PROJECT_NAME} ${SOURCES})

# 链接库
target_link_libraries(${PROJECT_NAME} 
    Threads::Threads
    OpenSSL::SSL 
    OpenSSL::Crypto
    nlohmann_json::nlohmann_json
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libcbmpc.a  # 添加cb-mpc库
)

# 添加包含目录
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/include/cb-mpc  # 添加cb-mpc头文件目录
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party
)

# 编译选项
target_compile_options(${PROJECT_NAME} PRIVATE
    -Wall -Wextra -O2
)

# 设置输出目录
set_target_properties(${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
) 