FROM opensearchproject/opensearch:2.12.0

COPY opensearch-analysis-ik212.zip /tmp/
RUN /usr/share/opensearch/bin/opensearch-plugin install file:///tmp/opensearch-analysis-ik212.zip --batch

# 拷贝自定义配置
COPY config/* /usr/share/opensearch/plugins/opensearch-analysis-ik/config/