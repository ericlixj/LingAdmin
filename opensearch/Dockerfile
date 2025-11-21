FROM opensearchproject/opensearch:2.12.0

USER root

# 复制插件文件
COPY opensearch-analysis-ik212.zip /tmp/

# 安装插件 - opensearch-plugin 脚本会自动查找 Java
# 如果自动查找失败，尝试手动设置 JAVA_HOME
RUN if [ -d "/usr/share/opensearch/jdk" ]; then \
        export JAVA_HOME=/usr/share/opensearch/jdk; \
    elif [ -d "/opt/opensearch/jdk" ]; then \
        export JAVA_HOME=/opt/opensearch/jdk; \
    else \
        JAVA_PATH=$(find /usr/share/opensearch -name "java" -type f 2>/dev/null | head -1); \
        if [ -n "$JAVA_PATH" ]; then \
            export JAVA_HOME=$(dirname $(dirname "$JAVA_PATH")); \
        fi; \
    fi && \
    if [ -n "$JAVA_HOME" ]; then \
        export PATH=$JAVA_HOME/bin:$PATH; \
        echo "Setting JAVA_HOME=$JAVA_HOME"; \
    fi && \
    /usr/share/opensearch/bin/opensearch-plugin install file:///tmp/opensearch-analysis-ik212.zip --batch

# 拷贝自定义配置
COPY config/ /usr/share/opensearch/plugins/opensearch-analysis-ik/config/

USER opensearch