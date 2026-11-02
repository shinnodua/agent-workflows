# Nạp context theo module trong workspace nhiều submodule

## Metadata

- Research ID: `RESEARCH-20261102-module-scoped-context`
- Title: Nạp source theo nhu cầu và giới hạn context theo module
- Type: `research`
- Status: `reviewed`
- Created: `2026-11-02`
- Last updated: `2026-11-02`
- Owner: `tech-lead`
- Related artifact IDs: `[]`
- Source request: `Nghiên cứu tối ưu context token: code module nào chỉ load module đó, chỉ load code module khác khi thực sự làm việc với nó.`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

Khuyến nghị áp dụng quy trình nạp context theo nhu cầu: root giữ bản đồ repository và hợp đồng tích hợp; agent xác định module trước khi tìm source; chỉ đọc file liên quan trong module hiện tại; mở thêm contract từ dependency khi có lý do cụ thể. Khi chuyển module hoặc giao việc, dùng context mới cùng bản bàn giao có phạm vi rõ nếu runtime hỗ trợ.

Workspace đã có `path`, `scope`, `agentGuide`, `artifactDirectories`, `codeScanDirectories` và `validation` trong profile. Thiếu quy tắc nhất quán về phạm vi **đọc**, cách mở rộng dependency và cách tránh truyền toàn bộ lịch sử cho agent nhận việc. Không tìm thấy bằng chứng trong các file workflow đã kiểm tra rằng workspace bắt buộc nạp toàn bộ source; đây là khoảng trống kiểm soát, chưa phải nguyên nhân đã được xác nhận bằng trace thực tế.

Nên bắt đầu bằng instruction và bàn giao có cấu trúc, tận dụng profile hiện có; chỉ thêm công cụ tạo gói context hoặc kiểm soát truy cập khi phép đo chứng minh cần thiết. Checkout hiện tại chỉ có repository ví dụ và `modules/.gitkeep`, nên chưa thể định lượng tiết kiệm token trên dự án nhiều module thật.

## Short Version

Root dùng để định tuyến; agent module chỉ nhận nhiệm vụ, instruction áp dụng, tài liệu yêu cầu liên quan, plan của module và contract cần dùng. Mọi tìm kiếm source phải chỉ rõ đường dẫn module. Đổi thư mục làm việc không xóa lịch sử hội thoại và instruction không phải cơ chế chặn filesystem.

## Research Questions

- Context đang có thể phình ra ở những điểm nào trong workflow?
- Có thể dùng profile hiện tại để định tuyến mà không đọc mọi repository không?
- Làm sao giới hạn source mà vẫn giữ đúng yêu cầu và tích hợp liên repository?
- Cần đo gì để kiểm chứng tiết kiệm token và chất lượng?

## Context

Đây là nghiên cứu cải tiến workspace tooling do root repository sở hữu. Người dùng mục tiêu là developer điều phối nhiều repository và các agent lập kế hoạch, triển khai, kiểm tra. Product source vẫn thuộc từng submodule.

`workspace.config.json` có auto mode bật. Yêu cầu hiện tại gọi riêng bước nghiên cứu, không yêu cầu triển khai tính năng; brief này không tự tạo PRD, plan hoặc sửa workflow. Chưa chạy agent triển khai hay đọc source product.

Cần phân biệt ba chi phí: instruction/skill được cung cấp lúc đầu; tài liệu và source trả về qua tool; lịch sử hội thoại được truyền tiếp. Script đọc nhiều file trên filesystem không đồng nghĩa mọi nội dung đó được đưa vào context của mô hình: phải xem tool trả về gì. Ngược lại, giới hạn output sau một tìm kiếm quá rộng có thể vẫn bỏ sót kết quả quan trọng; nên thu hẹp đường dẫn trước.

## Current Workspace Findings

- Root: [AGENTS.md](../AGENTS.md) yêu cầu xác định owner trước khi sửa và đọc guide/skill của submodule liên quan. Chưa định nghĩa đầy đủ phạm vi đọc mặc định và điều kiện mở rộng ra ngoài module.
- Profile: [repositories.json](../project/repositories.json) đủ để định tuyến sơ bộ mà không mở source. Các entry `example-core`, `example-service`, `example-web` là mẫu; không phải repository sản phẩm đã checkout.
- [PROJECT.md](../project/PROJECT.md) là profile tổng quát. Không nên suy ra dependency thực tế chỉ từ nhãn `shared`, `backend`, `frontend`.
- [create-plan skill](../.agents/skills/create-plan/SKILL.md) chỉ tạo plan cho repository bị ảnh hưởng và giao nhiệm vụ theo repository, nhưng chưa yêu cầu phạm vi tìm/đọc source cụ thể hoặc tránh kế thừa lịch sử không liên quan.
- [approve-plan skill](../.agents/skills/approve-plan/SKILL.md) có `exact allowed file scope` và giới hạn sửa file. Quy tắc đọc dependency, khối lượng context bàn giao và việc dùng context mới chưa được quy định tương ứng.
- [workflows.md](../workflows.md), phần Implementation Sequence, đã yêu cầu chỉ giao frontend agent plan của platform và root context liên quan. Đây là nền tảng cần mở rộng cho mọi role, cả xử lý tuần tự.
- [plan template](../templates/plan-template.md) có scope và research inputs, nhưng chưa có phần riêng nêu source entry points, dependency contracts và lý do mở rộng phạm vi đọc.
- [CLI](../bin/workflows.js), `shouldWriteReferenceShim` và `buildSkillShim`, sinh shim tới nguồn trong package. Sửa instruction sau này phải kiểm tra workspace được cài từ package, không chỉ checkout tác giả.
- [add-project script](../scripts/add-project.mjs) kiểm tra metadata `codeScanDirectories`. Trong các file CLI/scripts/skills đã tìm, chưa thấy cơ chế dùng trường này để cưỡng chế giới hạn đọc của agent. Không được gọi metadata hiện tại là sandbox.
- [integrity script](../scripts/workspace-integrity.ts) đọc Markdown từ các artifact directories và in kết quả kiểm tra; không phải bộ nạp toàn bộ product source vào prompt.
- Context cũ liên quan: [create-plan research](research-20261006-create-plan-command.md) xác nhận skill canonical cùng shim cho nhiều client; thay đổi sau này cần giữ một nguồn instruction chính.
- Diagram hiện có: `.archify/workflow-workspace-delivery-20260929-093455/` mô tả delivery workflow. Brief này không đổi workflow hoặc sơ đồ. Nếu triển khai thay đổi bước giao việc/triển khai, phải hỏi developer về cập nhật diagram theo quy tắc root.

## External Findings

Các nguồn chính thức dưới đây được truy cập ngày 2026-11-02. Chúng hỗ trợ nguyên tắc; thiết kế áp dụng cho workspace là đề xuất của nghiên cứu này.

- Codex ghép project instruction theo đường từ project root tới working directory, có giới hạn kích thước instruction. Vì vậy không nên giả định chạy ở root sẽ tự nạp guide của mọi submodule, hoặc chỉ đổi thư mục là đủ xác nhận mọi instruction cần thiết. Workspace vẫn phải chỉ rõ guide áp dụng. [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- Skills nạp metadata trước, nội dung `SKILL.md` khi được chọn. Điều này hỗ trợ hướng tổ chức tài liệu thành entry point nhỏ và references theo nhu cầu; không yêu cầu đọc toàn bộ mọi skill. Khi đã chọn skill, vẫn phải đọc và tuân thủ đầy đủ instruction của nó. [Build skills](https://learn.chatgpt.com/docs/build-skills).
- OpenAI khuyến nghị giữ `AGENTS.md` nhỏ, bổ sung routing khi agent đọc quá nhiều tài liệu. Suy luận áp dụng: root nên chứa quy tắc chọn owner và điểm mở tài liệu, tránh chép nội dung mọi repository vào root. [Customization](https://learn.chatgpt.com/docs/customization/overview).

Không suy rộng hành vi Codex thành bảo đảm cho Claude hoặc Antigravity. Discovery, kế thừa lịch sử và cách khởi tạo working directory phải được kiểm tra riêng trên runtime thực tế.

## Reference URLs

- https://learn.chatgpt.com/docs/agent-configuration/agents-md — instruction discovery; truy cập 2026-11-02. URL được chuyển hướng từ https://developers.openai.com/codex/guides/agents-md.
- https://learn.chatgpt.com/docs/build-skills — progressive disclosure; truy cập 2026-11-02. URL được chuyển hướng từ https://developers.openai.com/codex/skills.
- https://learn.chatgpt.com/docs/customization/overview — instruction nhỏ và routing; truy cập 2026-11-02.

## Product Implications

- Users and use cases: task một module, task xuyên module và điều tra lỗi chưa biết owner.
- Goals: giảm source không liên quan trong context, rút ngắn discovery, giữ đúng yêu cầu và integration.
- Non-goals: thay Git submodule, di chuyển product code, cắt instruction bắt buộc, xây vector database hoặc tự cài hệ thống agent mới.
- Workflow: nếu developer đã nêu module, dùng ngay làm phạm vi ban đầu; nếu chưa nêu, định tuyến bằng profile và artifact metadata. Chỉ hỏi khi ownership vẫn mơ hồ sau kiểm tra có mục tiêu.
- Không bắt developer duyệt từng lần mở dependency hợp lệ. Agent ghi lý do và đường dẫn mở rộng trong bàn giao; quyết định thay đổi scope triển khai vẫn theo PRD/plan.

## Technical Implications

- Affected repositories: root sở hữu instruction, skill, role, template và tùy chọn CLI. Chưa cần thay đổi product submodule hoặc dashboard.
- Shared contracts/data models: tái sử dụng profile. Chưa thêm field trước khi chứng minh `codeScanDirectories` cùng phạm vi theo task không đủ; trường này là điểm bắt đầu discovery, không phải danh sách tất cả file được phép đọc.
- API/backend và web/client: đọc public types/schema/API specification cần dùng; không mặc định đọc backend để làm frontend hoặc đọc mọi consumer để sửa core. Với thay đổi contract có khả năng phá vỡ tương thích, phải đánh giá các consumer liên quan theo từng phạm vi.
- App/runtime: khi tạo agent mới, chọn context mới và working directory của module nếu API hỗ trợ. Nếu chỉ có kế thừa toàn bộ hội thoại, phải báo hạn chế; không tuyên bố đã cô lập context.
- Security/privacy: quy tắc đọc là hướng dẫn hành vi. Nếu cần bảo đảm không truy cập module khác, phải dùng cơ chế quyền/tool/filesystem thực tế; đổi working directory hoặc ignore tìm kiếm không đủ.
- Performance/reliability: tránh ghép toàn bộ source, log, tree, plan vào prompt; dùng output có giới hạn và kết quả theo tên file trước, đọc đoạn liên quan sau. Không cắt ngang instruction hoặc output cần xác minh lỗi.

## Options

| Hướng | Lợi ích | Hạn chế | Khi phù hợp |
| --- | --- | --- | --- |
| Chỉ bổ sung quy tắc đọc theo module | Ít thay đổi, dùng được ngay với profile | Agent vẫn có thể đi lệch; lịch sử cũ còn nguyên | Bước đầu bắt buộc |
| Quy tắc + bàn giao gọn + context mới | Giảm cả source thừa và lịch sử truyền tiếp | Phụ thuộc khả năng runtime | Hướng khuyến nghị |
| Công cụ tạo gói context theo task | Nhất quán, có thể liệt kê đường dẫn và đo kích thước | Thêm schema, CLI, xử lý stale/path | Sau khi xác nhận nhu cầu qua trace |
| Cô lập quyền đọc thực tế | Có thể ngăn đọc ngoài phạm vi | Phức tạp, khó xử lý dependency và validation | Khi có yêu cầu cưỡng chế rõ ràng |

## Recommendation

Áp dụng hướng thứ hai theo các tầng sau; đây là đầu vào cho PRD, chưa phải implementation plan đã duyệt.

1. **Root routing:** đọc instruction áp dụng, project metadata và artifact liên quan; xác định owner trước source. Root coordinator giữ bản đồ dependency và kết quả tích hợp, không đọc mặc định toàn bộ source các module.
2. **Module discovery:** dùng tên file, cấu trúc thư mục nông và metadata package của đúng module để tìm entry points. Ưu tiên `rg --files modules/<id>/src` hoặc `rg -l '<symbol>' modules/<id>/src`; sau đó đọc file/đoạn cần thiết và test liên quan. Tên `<id>` phải thay bằng `path` thực trong profile, không tự suy ra từ ID.
3. **Module instructions:** đọc guide, instruction theo thư mục và skill liên quan trong module hiện tại; không mở guide và skill của mọi sibling. Những file build/test/config ngoài `src` vẫn được đọc khi task cần.
4. **Dependency expansion:** bắt đầu bằng tài liệu contract, exported types/schema hoặc file được import. Ghi dependency, câu hỏi cần trả lời, file cần đọc và lý do. Chỉ mở implementation bên kia khi public contract không đủ hoặc task thực sự đổi hành vi bên đó. Không tự duyệt đệ quy toàn bộ đồ thị dependency.
5. **Scoped handoff:** mỗi agent nhận một nhiệm vụ và module rõ ràng; không mặc định fork toàn bộ lịch sử. Gói bàn giao chứa yêu cầu liên quan, đường dẫn PRD/plan chuẩn, tóm tắt quyết định tích hợp, metadata owner, entry points, dependency contracts, phạm vi sửa, validation và unresolved questions. Tóm tắt phải giữ mọi acceptance criterion áp dụng; tài liệu chuẩn vẫn truy cập được để giải quyết mâu thuẫn.
6. **Module switch:** trong phiên tuần tự, ngừng đọc module cũ nhưng không coi đó là giải phóng token. Khi cần tránh mang source cũ theo, chuyển sang context mới với bàn giao đã kiểm chứng. Dùng agent theo workflow hiện có khi được yêu cầu/cho phép; không tạo nhiều agent chỉ để hy vọng tổng chi phí giảm.

Ví dụ phạm vi bàn giao cho một task web: đọc bắt buộc guide và plan web; source mặc định là path web; dependency tùy nhu cầu là đúng schema/API contract trong core/service; không tìm source ở mọi `modules/`. Nếu backend contract thiếu thông tin, mở đúng handler hoặc giao câu hỏi cho owner backend theo workflow. Kết quả trả về là contract đã xác minh, file thay đổi và validation, không phải bản sao source backend.

Nên thêm phần `Context Scope` vào template plan sau này: owner/path, required artifacts, source entry points, dependency read exceptions, allowed write scope, validation scope và bàn giao. Không tạo một tài liệu source summary toàn workspace phải cập nhật liên tục. Nếu cần manifest, chỉ lưu đường dẫn, mục đích và revision để phát hiện stale; tạo theo task thay vì snapshot mọi source.

## Risks And Mitigations

- Scope quá hẹp bỏ sót dependency: cho phép mở rộng có căn cứ từ import, contract, failing test hoặc change impact; giữ validation tích hợp phù hợp.
- Agent con kế thừa context lớn: xác minh chế độ khởi tạo; dùng prompt mới cùng bàn giao khi có; ghi nhận overhead nếu không có.
- Bàn giao làm mất yêu cầu: đối chiếu acceptance criteria áp dụng với PRD/plan chuẩn trước khi code và review; tóm tắt không thay thế nguồn chuẩn.
- Summary stale: ưu tiên source/contract hiện tại; ghi revision hoặc trạng thái dirty của dependency khi cần; không tái sử dụng gói cũ thiếu kiểm tra.
- Ràng buộc instruction bị nhầm thành sandbox: phân biệt rõ phạm vi đọc mong muốn, truy cập thực tế và phạm vi được sửa.
- Phép đo sai: tách token mô hình, cached input, tool-output bytes và số file. Không đồng nhất byte với token hoặc chi phí được tính tiền.
- Template và bản cài bị lệch: cập nhật nguồn canonical, kiểm tra generated shims bằng CLI tests; không chép cùng quy tắc dài sang mọi adapter.

## Highest-Risk Unknowns Or Clarifications Needed

- Chưa có trace task thật xác nhận nguồn token thừa là source scan, instruction, output test hay lịch sử kế thừa. Cần baseline trước khi cam kết mức giảm.
- Khả năng context mới, working directory và instruction discovery khác nhau giữa các client được workspace hỗ trợ; cần capability check thực tế.
- Chưa có profile dự án thật để xác minh dependency và contract entry points. Không thể suy ra từ ba entry mẫu.

Các điểm trên không cản trở viết PRD cho quy tắc định tuyến và giới hạn đọc. Chúng cản trở cam kết phần trăm tiết kiệm hoặc tuyên bố cô lập bắt buộc.

## Validation Ideas

- So sánh workflow hiện tại và đề xuất trên cùng revision, task, model/runtime và trạng thái checkout; lặp lại để thấy biến thiên. Ghi rõ fresh/warm context và cache.
- Task một module: log đường dẫn source được trả về cho mô hình; kỳ vọng không có source sibling ngoài ngoại lệ contract đã ghi.
- Task web dùng shared schema: chỉ đọc contract cần thiết, vẫn kiểm tra tương thích; không đọc toàn bộ core/service.
- Task xuyên module: mỗi phần việc có phạm vi riêng; coordinator nhận kết quả gọn và vẫn thực hiện review/validation tích hợp cần thiết.
- Task đổi module trong phiên: xác minh context cũ có được truyền lại hay không; không chỉ kiểm tra cwd.
- Task chưa rõ owner: định tuyến bằng metadata và tìm kiếm tên file có mục tiêu trước khi mở source; không quét nội dung toàn workspace theo mặc định.
- Fixture thiếu module, thiếu `src`, guide tùy biến và config ngoài code-scan roots: báo lỗi/điều chỉnh phạm vi hợp lý, không fallback sang đọc toàn workspace.
- Đo input/output tokens nếu runtime cung cấp, source bytes hiển thị, số file/source sibling được đọc, thời gian đến sửa đầu tiên và kết quả validation. Báo overhead tổng của tất cả agent.
- Research-only verification: kiểm tra metadata, liên kết local và `bun run workspace:integrity`. Nếu triển khai CLI/skill sau này, thêm CLI tests phù hợp; không cần chạy dashboard build cho brief này.

## Open Questions

- Dữ liệu task thật có yêu cầu công cụ tạo gói context ngay, hay instruction và bàn giao đã đủ? Khuyến nghị bắt đầu bằng instruction và đo trước.
- Có yêu cầu chặn filesystem cứng không? Theo yêu cầu hiện tại, mặc định là tối ưu context, chưa có yêu cầu cưỡng chế truy cập.

## Follow-Up Inputs For PRD Or Plan

- Suggested PRD scope: module routing, quy tắc tìm/đọc, bàn giao gọn, xử lý dependency và xác minh capability runtime; công cụ tạo gói context là tùy chọn sau baseline.
- Suggested affected platforms: root AGENTS/CLAUDE guidance nếu áp dụng, `workflows.md`, skills research/create-plan/approve-plan, roles triển khai, plan template; CLI/shims/tests nếu có hành vi mới trong bản cài.
- Suggested acceptance criteria: chọn owner trước source; search source có path rõ; không đọc source sibling không liên quan; ngoại lệ dependency có lý do; giữ đủ yêu cầu và validation; không tuyên bố context mới nếu thực tế vẫn fork history; bảo toàn user changes và quy tắc không commit.
- Suggested sequencing: lấy baseline → xác định quy tắc và bàn giao → kiểm chứng trên task một module và xuyên module → chỉ bổ sung tooling khi thiếu nhất quán hoặc khó đo.
- Dependencies or decisions needed first: profile dự án thật, trace đại diện và runtime mục tiêu. Nếu thay đổi delivery workflow, hỏi developer có cập nhật diagram hiện có không, kèm tên diagram và các file sẽ đổi.
