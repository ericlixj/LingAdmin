FROM opensearchproject/opensearch:2.12.0

# 明确设置 JAVA_HOME（按 OpenSearch 镜像的默认路径）
ENV JAVA_HOME=/usr/share/opensearch/jdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

COPY opensearch-analysis-ik212.zip /tmp/
RUN /usr/share/opensearch/bin/opensearch-plugin install file:///tmp/opensearch-analysis-ik212.zip --batch

# 拷贝自定义配置
COPY config/* /usr/share/opensearch/plugins/opensearch-analysis-ik/config/