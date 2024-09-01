
alter table customer_credit modify customer_credit_date datetime not null default now();
alter table customer_credit_rec_hist drop column slno;
alter table customer_credit_rec_hist modify next_credit_date varchar(20) not null;
alter table customer_credit_rec_hist modify inserted_date datetime not null default now();